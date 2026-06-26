import React, { useState } from 'react';
import { Transaction } from '../types';
import { useStore } from '../store';
import { X, Star } from 'lucide-react';

interface ValidationModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export function ValidationModal({ transaction, onClose }: ValidationModalProps) {
  const { updateTransaction } = useStore();
  const [rating, setRating] = useState<number>(transaction.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [validationComment, setValidationComment] = useState<string>(transaction.validationComment || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTransaction(transaction.id, {
      isValidated: true,
      rating,
      validationComment: validationComment || undefined
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in" id="validation-modal-overlay">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-scale-up" id="validation-modal-container">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Valider la réservation</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {transaction.firstName || transaction.lastName 
                ? `${transaction.firstName || ''} ${transaction.lastName || ''}`.trim()
                : 'Réservation sans nom'} • {transaction.platform}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            id="validation-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" id="validation-modal-form">
          {/* Info Banner */}
          <div className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-md p-3">
            <div className="flex justify-between font-medium text-blue-900 mb-1">
              <span>Date d'arrivée :</span>
              <span>
                {new Date(transaction.date).toLocaleDateString('fr-FR', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Nuits / Montant :</span>
              <span className="font-semibold text-blue-950">
                {transaction.nights || 1} nuit(s) • {transaction.amount} €
              </span>
            </div>
          </div>

          {/* Star Rating Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 text-center">
              Évaluation du séjour (1 à 5 étoiles)
            </label>
            <div className="flex justify-center items-center gap-2 py-2" id="star-rating-container">
              {[1, 2, 3, 4, 5].map((star) => {
                const isSelected = star <= (hoverRating !== null ? hoverRating : rating);
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 focus:outline-none transition-transform hover:scale-115 focus:scale-115"
                    title={`Évaluer ${star} étoile(s)`}
                    id={`star-btn-${star}`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        isSelected 
                          ? 'fill-amber-400 text-amber-500' 
                          : 'text-gray-300 fill-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <p className="text-center text-xs font-semibold text-amber-600">
              {rating === 1 && 'Très décevant'}
              {rating === 2 && 'Moyen'}
              {rating === 3 && 'Bon'}
              {rating === 4 && 'Excellent'}
              {rating === 5 && 'Parfait'}
            </p>
          </div>

          {/* Validation Comment */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700" htmlFor="validation-comment">
              Commentaire de validation / Avis
            </label>
            <textarea
              id="validation-comment"
              rows={3}
              placeholder="Saisissez des détails sur la propreté, la communication, le respect du règlement, ou tout autre commentaire sur ce client..."
              value={validationComment}
              onChange={(e) => setValidationComment(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500 resize-none shadow-sm"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100" id="validation-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              id="validation-cancel-btn"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-sm transition-colors flex items-center"
              id="validation-confirm-btn"
            >
              Valider la réservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
