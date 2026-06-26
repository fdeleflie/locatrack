import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, X, Edit2, CheckCircle2, Circle } from 'lucide-react';
import { Transaction } from '../types';
import { EditModal } from './EditModal';

export function DataEntry() {
  const { state, addTransaction, removeTransaction, updateTransaction } = useStore();
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platformData, setPlatformData] = useState<Record<string, { checked: boolean; amount: string; clientAmount?: string; commission?: string; bankFee?: string }>>({});
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [nights, setNights] = useState(1);
  const [adults, setAdults] = useState<number | ''>('');
  const [children, setChildren] = useState<number | ''>('');
  const [comments, setComments] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Transaction>>({});

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  const years = useMemo(() => {
    const y = new Set<string>(state.transactions.map((t) => t.date.substring(0, 4)));
    y.add(new Date().getFullYear().toString());
    return Array.from(y).sort((a, b) => b.localeCompare(a));
  }, [state.transactions]);

  const filteredTransactions = useMemo(() => {
    return state.transactions
      .filter((t) => t.date.startsWith(selectedYear))
      .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending
  }, [state.transactions, selectedYear]);

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Adjust for Monday start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    
    const days = [];
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [currentMonth]);


  // Initialize platform data when settings change
  React.useEffect(() => {
    setPlatformData((prev) => {
      const next: Record<string, { checked: boolean; amount: string; clientAmount: string }> = {};
      state.settings.platforms.forEach(p => {
        next[p] = prev[p] || { checked: false, amount: '', clientAmount: '' };
      });
      return next;
    });
  }, [state.settings.platforms]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    
    let added = false;
    Object.entries(platformData).forEach(([plat, data]: [string, any]) => {
      if (data.checked && data.amount) {
        addTransaction({
          date,
          amount: parseFloat(data.amount),
          clientAmount: data.clientAmount ? parseFloat(data.clientAmount) : undefined,
          commission: data.commission ? parseFloat(data.commission) : undefined,
          bankFee: data.bankFee ? parseFloat(data.bankFee) : undefined,
          platform: plat,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          phone: phone || undefined,
          nights,
          adults: typeof adults === 'number' ? adults : undefined,
          children: typeof children === 'number' ? children : undefined,
          comments: comments || undefined,
        });
        added = true;
      }
    });

    if (added) {
      setPlatformData((prev) => {
        const next: Record<string, { checked: boolean; amount: string; clientAmount: string; commission: string; bankFee: string }> = {};
        state.settings.platforms.forEach(p => {
          next[p] = { checked: false, amount: '', clientAmount: '', commission: '', bankFee: '' };
        });
        return next;
      });
      setFirstName('');
      setLastName('');
      setPhone('');
      setNights(1);
      setAdults('');
      setChildren('');
      setComments('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-800">Saisie des revenus</h2>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          className="border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              Année {y}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-900 mb-4 pb-2 border-b">Nouvelle Saisie</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex gap-4">
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date d'arrivée</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de nuits</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={nights}
                    onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                    className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Informations Locataire (Optionnel)</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                  <input
                    type="text"
                    placeholder="Prénom"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Nom"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Adultes :</label>
                    <input
                      type="number"
                      min="0"
                      value={adults}
                      onChange={(e) => setAdults(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 whitespace-nowrap">Enfants :</label>
                    <input
                      type="number"
                      min="0"
                      value={children}
                      onChange={(e) => setChildren(e.target.value === '' ? '' : parseInt(e.target.value))}
                      className="border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 w-full"
                    />
                  </div>
                </div>
                <div>
                  <textarea
                    placeholder="Commentaires ou notes sur la réservation..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Plateformes (sélectionnez et saisissez le montant)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {state.settings.platforms.map((p) => {
                    const checked = platformData[p]?.checked || false;
                    const amount = platformData[p]?.amount || '';
                    const clientAmount = platformData[p]?.clientAmount || '';
                    const commission = platformData[p]?.commission || '';
                    const bankFee = platformData[p]?.bankFee || '';
                    const color = state.settings.platformColors?.[p] || '#ccc';
                    
                    const calculateAmount = (client: string, comm: string, bank: string) => {
                      if (!client) return '';
                      const c = parseFloat(client) || 0;
                      const c_comm = parseFloat(comm) || 0;
                      const c_bank = parseFloat(bank) || 0;
                      return (c - c_comm - c_bank).toFixed(2);
                    };

                    return (
                      <div key={p} className="flex flex-col bg-gray-50 border border-gray-200 rounded-md p-3">
                        <label className="flex items-center space-x-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setPlatformData((prev) => ({
                                ...prev,
                                [p]: { ...prev[p], checked: e.target.checked }
                              }));
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            style={{ accentColor: color }}
                          />
                          <span className="text-sm font-medium text-gray-800" style={{ color: checked ? color : 'inherit' }}>{p}</span>
                        </label>
                        {checked && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={clientAmount}
                              onChange={(e) => {
                                const newClientAmount = e.target.value;
                                setPlatformData((prev) => ({
                                  ...prev,
                                  [p]: { 
                                    ...prev[p], 
                                    clientAmount: newClientAmount, 
                                    amount: calculateAmount(newClientAmount, commission, bankFee) 
                                  }
                                }));
                              }}
                              placeholder="Payé par le client (€)"
                              className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={commission}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPlatformData((prev) => ({
                                    ...prev,
                                    [p]: { 
                                      ...prev[p], 
                                      commission: val, 
                                      amount: calculateAmount(clientAmount, val, bankFee) 
                                    }
                                  }));
                                }}
                                placeholder="Commission (€)"
                                className="w-1/2 border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={bankFee}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setPlatformData((prev) => ({
                                    ...prev,
                                    [p]: { 
                                      ...prev[p], 
                                      bankFee: val, 
                                      amount: calculateAmount(clientAmount, commission, val) 
                                    }
                                  }));
                                }}
                                placeholder="Frais bancaire (€)"
                                className="w-1/2 border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              required={checked}
                              value={amount}
                              onChange={(e) => {
                                setPlatformData((prev) => ({
                                  ...prev,
                                  [p]: { ...prev[p], amount: e.target.value }
                                }));
                              }}
                              placeholder="Montant perçu (€)"
                              className="w-full border border-gray-300 rounded-md shadow-sm py-1.5 px-3 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div className="self-end mt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center shadow-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
               <h3 className="text-lg font-medium text-gray-900">Historique ({selectedYear})</h3>
            </div>
            <div className="max-h-[500px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plateforme</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                        Aucun revenu enregistré pour cette année.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t) => {
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => updateTransaction(t.id, { isValidated: !t.isValidated })}
                                className={`${t.isValidated ? 'text-green-500' : 'text-gray-300 hover:text-green-400'} transition-colors`}
                                title={t.isValidated ? "Validé" : "Marquer comme validé"}
                              >
                                {t.isValidated ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                              </button>
                              {new Date(t.date).toLocaleDateString('fr-FR', {
                                weekday: 'short', day: 'numeric', month: 'short'
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div>{t.firstName || t.lastName ? `${t.firstName || ''} ${t.lastName || ''}`.trim() : '-'}</div>
                            {(t.adults !== undefined || t.children !== undefined) && (
                              <div className="text-xs mt-1 text-gray-600">
                                {t.adults !== undefined ? `${t.adults} adulte(s)` : ''} {t.children !== undefined ? `${t.children} enfant(s)` : ''}
                              </div>
                            )}
                            {t.comments && (
                              <div className="text-xs text-gray-400 mt-1 italic whitespace-normal max-w-[200px]">{t.comments}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                            <div className="flex flex-col">
                              <span>{t.amount} € <span className="text-gray-500 text-xs font-normal ml-1">({t.nights || 1} {t.nights && t.nights > 1 ? 'nuits' : 'nuit'})</span></span>
                              {t.clientAmount && <span className="text-xs text-gray-500 font-normal">Client: {t.clientAmount} €</span>}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className="inline-flex items-center text-xs font-medium text-gray-700">
                              <span 
                                className="w-2.5 h-2.5 rounded-full mr-2" 
                                style={{ backgroundColor: state.settings.platformColors?.[t.platform] || '#ccc' }}
                              />
                              {t.platform}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => {
                                  setEditingId(t.id);
                                  setEditData(t);
                                }}
                                className="text-blue-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                                title="Modifier"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => removeTransaction(t.id)}
                                className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Calendar Column */}
        <div className="lg:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 sticky top-20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Calendrier</h3>
              <div className="flex space-x-1">
                <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-medium w-24 text-center">
                  {currentMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-1 text-center mb-2">
              {['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'].map(d => (
                <div key={d} className="text-xs font-medium text-gray-500 py-1">{d}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                if (!date) return <div key={`empty-${idx}`} className="p-2" />;
                
                const dateStr = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                // Check if there is a transaction on this date
                const dayTxs = state.transactions.filter(t => {
                  const start = new Date(t.date);
                  const end = new Date(t.date);
                  end.setDate(end.getDate() + (t.nights || 1) - 1);
                  const current = new Date(dateStr);
                  return current >= start && current <= end;
                });
                
                return (
                  <div 
                    key={dateStr} 
                    className={`relative p-1 min-h-[56px] text-sm text-center rounded-md cursor-pointer hover:bg-gray-100 flex flex-col items-center justify-start
                      ${dateStr === new Date().toISOString().split('T')[0] ? 'ring-1 ring-blue-400 font-bold text-blue-600' : ''}
                    `}
                    onClick={() => setDate(dateStr)}
                  >
                    <span className="z-10 relative inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/90 font-medium shadow-sm backdrop-blur-sm">{date.getDate()}</span>
                    
                    {/* Platform bars */}
                    {dayTxs.length > 0 && (
                      <div className="absolute top-8 left-0 right-0 flex flex-col gap-0.5 z-0">
                        {dayTxs.map(t => {
                          const isStart = t.date === dateStr;
                          const endD = new Date(t.date);
                          endD.setDate(endD.getDate() + (t.nights || 1) - 1);
                          const isEnd = endD.toISOString().split('T')[0] === dateStr;
                          
                          return (
                            <div 
                              key={t.id}
                              className="py-1.5 px-0.5 cursor-pointer group relative"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(t.id);
                                setEditData(t);
                              }}
                              title={`${t.platform} - ${t.firstName || ''} ${t.lastName || ''} : ${t.amount}€`}
                            >
                              <div 
                                className={`h-3 ${isStart ? 'rounded-l-md' : ''} ${isEnd ? 'rounded-r-md' : ''} relative flex items-center transition-opacity group-hover:opacity-80 shadow-sm`} 
                                style={{ 
                                  backgroundColor: state.settings.platformColors?.[t.platform] || '#9ca3af',
                                  marginLeft: isStart ? '2px' : '-2px',
                                  marginRight: isEnd ? '2px' : '-2px'
                                }}
                              >
                                {isStart && <div className="w-2 h-2 bg-white border border-gray-400 rounded-full absolute left-0.5 shadow-sm" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 border-t pt-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Légende</h4>
              <div className="space-y-2">
                {state.settings.platforms.map(p => (
                  <div key={p} className="flex items-center text-sm text-gray-700">
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: state.settings.platformColors?.[p] || '#ccc' }} />
                    {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
      
      {editingId && editData && (
        <EditModal
          transaction={editData as Transaction}
          onClose={() => {
            setEditingId(null);
            setEditData({});
          }}
        />
      )}
    </div>
  );
}
