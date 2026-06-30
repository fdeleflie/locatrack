import React, { useState } from 'react';
import { useStore } from '../store';
import { ValidationModal } from './ValidationModal';
import { CheckCircle2, Circle, AlertCircle, Edit } from 'lucide-react';
import { EditModal } from './EditModal';
import { Transaction } from '../types';

export function ValidationList() {
  const { state, updateTransaction } = useStore();
  const [validatingTx, setValidatingTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const pendingTransactions = state.transactions
    .filter(t => !t.isValidated)
    .sort((a, b) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const aPast = a.date < todayStr;
      const bPast = b.date < todayStr;
      if (aPast && !bPast) return -1;
      if (!aPast && bPast) return 1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  if (pendingTransactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white rounded-lg shadow border border-gray-200">
        <CheckCircle2 className="w-12 h-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Toutes les réservations sont validées !</h3>
        <p className="text-gray-500 text-center">Vous n'avez aucune réservation en attente de validation.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex items-center mb-4">
          <AlertCircle className="w-6 h-6 text-orange-500 mr-2" />
          <h2 className="text-xl font-bold text-gray-900">Réservations à valider ({pendingTransactions.length})</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plateforme</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voyageur</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Nuits</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Revenu</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingTransactions.map((t) => {
                const dateObj = new Date(t.date);
                const endDateObj = new Date(dateObj);
                endDateObj.setDate(dateObj.getDate() + (t.nights || 1));
                
                const isPast = t.date < new Date().toISOString().split('T')[0];
                
                return (
                  <tr key={t.id} className={`${isPast ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-gray-50'} transition-colors`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        {isPast && <AlertCircle className="w-4 h-4 text-orange-500 mr-1.5 flex-shrink-0" title="Date de début dépassée" />}
                        Du {dateObj.toLocaleDateString('fr-FR')}
                      </div>
                      <div className={`text-xs ${isPast ? 'ml-5.5 text-orange-600/70' : 'text-gray-500'}`} style={isPast ? { marginLeft: '22px' } : {}}>Au {endDateObj.toLocaleDateString('fr-FR')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: `${state.settings.platformColors?.[t.platform] || '#ccc'}20`, color: state.settings.platformColors?.[t.platform] || '#666' }}>
                        {t.platform}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {t.firstName || t.lastName ? `${t.firstName || ''} ${t.lastName || ''}` : <span className="text-gray-400 italic">Non renseigné</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                      {t.nights || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                      {t.amount} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => setValidatingTx(t)}
                          className="text-gray-400 hover:text-green-500 transition-colors flex flex-col items-center group"
                          title="Valider cette réservation"
                        >
                          <Circle className="w-5 h-5 group-hover:hidden" />
                          <CheckCircle2 className="w-5 h-5 hidden group-hover:block" />
                        </button>
                        <button
                          onClick={() => setEditingTx(t)}
                          className="text-gray-400 hover:text-blue-500 transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      {validatingTx && (
        <ValidationModal 
          transaction={validatingTx} 
          onClose={() => setValidatingTx(null)} 
        />
      )}
      
      {editingTx && (
        <EditModal 
          transaction={editingTx} 
          onClose={() => setEditingTx(null)} 
        />
      )}
    </div>
  );
}
