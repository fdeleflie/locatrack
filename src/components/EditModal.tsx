import React, { useState, useEffect } from 'react';
import { Transaction } from '../types';
import { useStore } from '../store';
import { X, Star } from 'lucide-react';

export function EditModal({ transaction, onClose }: { transaction: Transaction, onClose: () => void }) {
  const { state, updateTransaction } = useStore();
  
  const [date, setDate] = useState(transaction.date);
  const [amount, setAmount] = useState(transaction.amount.toString());
  const [clientAmount, setClientAmount] = useState(transaction.clientAmount?.toString() || '');
  const [commission, setCommission] = useState(transaction.commission?.toString() || '');
  const [bankFee, setBankFee] = useState(transaction.bankFee?.toString() || '');
  const [platform, setPlatform] = useState(transaction.platform);
  const [firstName, setFirstName] = useState(transaction.firstName || '');
  const [lastName, setLastName] = useState(transaction.lastName || '');
  const [phone, setPhone] = useState(transaction.phone || '');
  const [nights, setNights] = useState(transaction.nights || 1);
  const [adults, setAdults] = useState<number | ''>(transaction.adults ?? '');
  const [children, setChildren] = useState<number | ''>(transaction.children ?? '');
  const [comments, setComments] = useState(transaction.comments || '');
  const [isValidated, setIsValidated] = useState(transaction.isValidated || false);
  const [rating, setRating] = useState<number>(transaction.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [validationComment, setValidationComment] = useState<string>(transaction.validationComment || '');

  const calculateAmount = (client: string, comm: string, bank: string) => {
    if (!client) return;
    const c = parseFloat(client) || 0;
    const c_comm = parseFloat(comm) || 0;
    const c_bank = parseFloat(bank) || 0;
    setAmount((c - c_comm - c_bank).toFixed(2));
  };

  const handleClientAmountChange = (newClientAmount: string) => {
    setClientAmount(newClientAmount);
    calculateAmount(newClientAmount, commission, bankFee);
  };

  const handleCommissionChange = (newCommission: string) => {
    setCommission(newCommission);
    calculateAmount(clientAmount, newCommission, bankFee);
  };

  const handleBankFeeChange = (newBankFee: string) => {
    setBankFee(newBankFee);
    calculateAmount(clientAmount, commission, newBankFee);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTransaction(transaction.id, {
      date,
      amount: parseFloat(amount),
      clientAmount: clientAmount ? parseFloat(clientAmount) : undefined,
      commission: commission ? parseFloat(commission) : undefined,
      bankFee: bankFee ? parseFloat(bankFee) : undefined,
      platform,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      phone: phone || undefined,
      nights,
      adults: typeof adults === 'number' ? adults : undefined,
      children: typeof children === 'number' ? children : undefined,
      comments: comments || undefined,
      isValidated,
      rating: isValidated ? rating : undefined,
      validationComment: isValidated && validationComment ? validationComment : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Modifier la réservation</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Date d'arrivée</label>
              <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de nuits</label>
              <input type="number" min="1" required value={nights} onChange={(e) => setNights(parseInt(e.target.value) || 1)} className="w-full border border-gray-300 rounded-md py-2 px-3" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Informations Locataire</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <input type="text" placeholder="Prénom" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
              <input type="text" placeholder="Nom" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
              <input type="tel" placeholder="Téléphone" value={phone} onChange={(e) => setPhone(e.target.value)} className="border border-gray-300 rounded-md py-2 px-3" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Adultes :</label>
                <input type="number" min="0" value={adults} onChange={(e) => setAdults(e.target.value === '' ? '' : parseInt(e.target.value))} className="border border-gray-300 rounded-md py-1.5 px-3 w-full" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Enfants :</label>
                <input type="number" min="0" value={children} onChange={(e) => setChildren(e.target.value === '' ? '' : parseInt(e.target.value))} className="border border-gray-300 rounded-md py-1.5 px-3 w-full" />
              </div>
            </div>
            <textarea placeholder="Commentaires..." value={comments} onChange={(e) => setComments(e.target.value)} rows={2} className="w-full border border-gray-300 rounded-md py-2 px-3" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plateforme et Montant</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Plateforme</label>
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3">
                  {state.settings.platforms.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Payé par le client (€)</label>
                <input type="number" step="0.01" min="0" value={clientAmount} onChange={(e) => handleClientAmountChange(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Commission (€)</label>
                <input type="number" step="0.01" min="0" value={commission} onChange={(e) => handleCommissionChange(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Frais bancaire (€)</label>
                <input type="number" step="0.01" min="0" value={bankFee} onChange={(e) => handleBankFeeChange(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Montant perçu (€)</label>
                <input type="number" step="0.01" min="0" required value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full border border-gray-300 rounded-md py-2 px-3" />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t space-y-4">
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                <input
                  type="checkbox"
                  checked={isValidated}
                  onChange={(e) => setIsValidated(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">Valider cette réservation</span>
              </label>
            </div>

            {isValidated && (
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-100 space-y-3 animate-fade-in">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Évaluation du séjour (1 à 5 étoiles)
                  </label>
                  <div className="flex items-center gap-1.5 py-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isSelected = star <= (hoverRating !== null ? hoverRating : rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          className="p-0.5 focus:outline-none transition-transform hover:scale-110"
                          title={`Évaluer ${star} étoile(s)`}
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              isSelected 
                                ? 'fill-amber-400 text-amber-500' 
                                : 'text-gray-300 fill-transparent'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-semibold text-amber-600 ml-2">
                      {rating === 1 && 'Très décevant'}
                      {rating === 2 && 'Moyen'}
                      {rating === 3 && 'Bon'}
                      {rating === 4 && 'Excellent'}
                      {rating === 5 && 'Parfait'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Commentaire de validation / Avis
                  </label>
                  <textarea
                    placeholder="Saisissez des commentaires sur la propreté, la communication, ou d'autres remarques..."
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    rows={2}
                    className="w-full border border-gray-300 rounded-md py-1.5 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors">Annuler</button>
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Enregistrer</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
