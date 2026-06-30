import React, { useState, useEffect } from "react";
import { Transaction } from "../types";
import { useStore } from "../store";
import { X, Star, Trash2 } from "lucide-react";

export function EditModal({
  transaction,
  onClose,
}: {
  transaction: Transaction;
  onClose: () => void;
}) {
  const { state, updateTransaction, removeTransaction, addTransaction } =
    useStore();

  const [date, setDate] = useState(transaction.date);
  const [firstName, setFirstName] = useState(transaction.firstName || "");
  const [lastName, setLastName] = useState(transaction.lastName || "");
  const [phone, setPhone] = useState(transaction.phone || "");
  const [nights, setNights] = useState(transaction.nights || 1);
  const [adults, setAdults] = useState<number | "">(transaction.adults ?? "");
  const [children, setChildren] = useState<number | "">(
    transaction.children ?? "",
  );
  const [comments, setComments] = useState(transaction.comments || "");
  const [isValidated, setIsValidated] = useState(
    transaction.isValidated || false,
  );
  const [rating, setRating] = useState<number>(transaction.rating || 5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [validationComment, setValidationComment] = useState<string>(
    transaction.validationComment || "",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Group all siblings that share the exact date and nights
  const [platformData, setPlatformData] = useState<
    Record<
      string,
      {
        id?: string;
        checked: boolean;
        amount: string;
        clientAmount: string;
        commission: string;
        bankFee: string;
      }
    >
  >(() => {
    const initial: Record<string, any> = {};
    const siblings = state.transactions.filter(
      (t) => t.date === transaction.date && t.nights === transaction.nights,
    );
    state.settings.platforms.forEach((p) => {
      const existing = siblings.find((t) => t.platform === p);
      initial[p] = {
        id: existing?.id,
        checked: !!existing,
        amount: existing?.amount?.toString() || "",
        clientAmount: existing?.clientAmount?.toString() || "",
        commission: existing?.commission?.toString() || "",
        bankFee: existing?.bankFee?.toString() || "",
      };
    });
    return initial;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Object.entries(platformData).forEach(([plat, data]: [string, any]) => {
      if (data.checked && data.amount) {
        if (data.id) {
          updateTransaction(data.id, {
            date,
            amount: parseFloat(data.amount),
            clientAmount: data.clientAmount
              ? parseFloat(data.clientAmount)
              : undefined,
            commission: data.commission
              ? parseFloat(data.commission)
              : undefined,
            bankFee: data.bankFee ? parseFloat(data.bankFee) : undefined,
            platform: plat,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phone: phone || undefined,
            nights,
            adults: typeof adults === "number" ? adults : undefined,
            children: typeof children === "number" ? children : undefined,
            comments: comments || undefined,
            isValidated,
            rating: isValidated ? rating : undefined,
            validationComment:
              isValidated && validationComment ? validationComment : undefined,
          });
        } else {
          addTransaction({
            date,
            amount: parseFloat(data.amount),
            clientAmount: data.clientAmount
              ? parseFloat(data.clientAmount)
              : undefined,
            commission: data.commission
              ? parseFloat(data.commission)
              : undefined,
            bankFee: data.bankFee ? parseFloat(data.bankFee) : undefined,
            platform: plat,
            firstName: firstName || undefined,
            lastName: lastName || undefined,
            phone: phone || undefined,
            nights,
            adults: typeof adults === "number" ? adults : undefined,
            children: typeof children === "number" ? children : undefined,
            comments: comments || undefined,
            isValidated,
            rating: isValidated ? rating : undefined,
            validationComment:
              isValidated && validationComment ? validationComment : undefined,
          });
        }
      } else if (data.id && !data.checked) {
        removeTransaction(data.id);
      }
    });
    onClose();
  };

  const handleDeleteAll = () => {
    Object.values(platformData).forEach((data: any) => {
      if (data.id) removeTransaction(data.id);
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">Modifier la réservation</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date d'arrivée
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de nuits
              </label>
              <input
                type="number"
                min="1"
                required
                value={nights}
                onChange={(e) => setNights(parseInt(e.target.value) || 1)}
                className="w-full border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Informations Locataire
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
              <input
                type="text"
                placeholder="Prénom"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <input
                type="text"
                placeholder="Nom"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="border border-gray-300 rounded-md py-2 px-3"
              />
              <input
                type="tel"
                placeholder="Téléphone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="border border-gray-300 rounded-md py-2 px-3"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Adultes :</label>
                <input
                  type="number"
                  min="0"
                  value={adults}
                  onChange={(e) =>
                    setAdults(
                      e.target.value === "" ? "" : parseInt(e.target.value),
                    )
                  }
                  className="border border-gray-300 rounded-md py-1.5 px-3 w-full"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Enfants :</label>
                <input
                  type="number"
                  min="0"
                  value={children}
                  onChange={(e) =>
                    setChildren(
                      e.target.value === "" ? "" : parseInt(e.target.value),
                    )
                  }
                  className="border border-gray-300 rounded-md py-1.5 px-3 w-full"
                />
              </div>
            </div>
            <textarea
              placeholder="Commentaires..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={2}
              className="w-full border border-gray-300 rounded-md py-2 px-3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plateformes (sélectionnez et saisissez le montant)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {state.settings.platforms.map((p) => {
                const checked = platformData[p]?.checked || false;
                const amount = platformData[p]?.amount || "";
                const clientAmount = platformData[p]?.clientAmount || "";
                const commission = platformData[p]?.commission || "";
                const bankFee = platformData[p]?.bankFee || "";
                const color = state.settings.platformColors?.[p] || "#ccc";

                return (
                  <div
                    key={p}
                    className="flex flex-col bg-gray-50 border border-gray-200 rounded-md p-3"
                  >
                    <label className="flex items-center space-x-2 cursor-pointer mb-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setPlatformData((prev) => ({
                            ...prev,
                            [p]: { ...prev[p], checked: e.target.checked },
                          }));
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        style={{ accentColor: color }}
                      />
                      <span
                        className="text-sm font-medium text-gray-800"
                        style={{ color: checked ? color : "inherit" }}
                      >
                        {p}
                      </span>
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
                            setPlatformData((prev) => {
                              const pData = prev[p];
                              let newAmount = pData.amount;
                              let newCommission = pData.commission;
                              if (newClientAmount) {
                                const c = parseFloat(newClientAmount) || 0;
                                const a = parseFloat(pData.amount) || 0;
                                const comm = parseFloat(pData.commission) || 0;
                                const b = parseFloat(pData.bankFee) || 0;

                                const feeConfig =
                                  state.settings.platformFees?.[p];
                                if (feeConfig && feeConfig.active) {
                                  const calculatedComm =
                                    c * (feeConfig.percentage / 100);
                                  newCommission = calculatedComm
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                  newAmount = (c - calculatedComm - b)
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                } else {
                                  if (pData.amount && !pData.commission) {
                                    newCommission = (c - a - b)
                                      .toFixed(2)
                                      .replace(/\.00$/, "");
                                  } else {
                                    newAmount = (c - comm - b)
                                      .toFixed(2)
                                      .replace(/\.00$/, "");
                                  }
                                }
                              }
                              return {
                                ...prev,
                                [p]: {
                                  ...pData,
                                  clientAmount: newClientAmount,
                                  amount: newAmount,
                                  commission: newCommission,
                                },
                              };
                            });
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
                              setPlatformData((prev) => {
                                const pData = prev[p];
                                let newAmount = pData.amount;
                                if (pData.clientAmount) {
                                  const c = parseFloat(pData.clientAmount) || 0;
                                  const c_comm = parseFloat(val) || 0;
                                  const c_bank = parseFloat(pData.bankFee) || 0;
                                  newAmount = (c - c_comm - c_bank)
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                }
                                return {
                                  ...prev,
                                  [p]: {
                                    ...pData,
                                    commission: val,
                                    amount: newAmount,
                                  },
                                };
                              });
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
                              setPlatformData((prev) => {
                                const pData = prev[p];
                                let newAmount = pData.amount;
                                if (pData.clientAmount) {
                                  const c = parseFloat(pData.clientAmount) || 0;
                                  const c_comm =
                                    parseFloat(pData.commission) || 0;
                                  const c_bank = parseFloat(val) || 0;
                                  newAmount = (c - c_comm - c_bank)
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                }
                                return {
                                  ...prev,
                                  [p]: {
                                    ...pData,
                                    bankFee: val,
                                    amount: newAmount,
                                  },
                                };
                              });
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
                            const newAmount = e.target.value;
                            setPlatformData((prev) => {
                              const pData = prev[p];
                              let newCommission = pData.commission;
                              let newClientAmount = pData.clientAmount;

                              const feeConfig =
                                state.settings.platformFees?.[p];
                              if (feeConfig && feeConfig.active) {
                                const a = parseFloat(newAmount) || 0;
                                const b = parseFloat(pData.bankFee) || 0;
                                const perc = feeConfig.percentage / 100;
                                if (perc < 1) {
                                  const calculatedClientAmount =
                                    (a + b) / (1 - perc);
                                  newClientAmount = calculatedClientAmount
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                  newCommission = (
                                    calculatedClientAmount -
                                    a -
                                    b
                                  )
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                }
                              } else {
                                if (pData.clientAmount) {
                                  const c = parseFloat(pData.clientAmount) || 0;
                                  const a = parseFloat(newAmount) || 0;
                                  const b = parseFloat(pData.bankFee) || 0;
                                  newCommission = (c - a - b)
                                    .toFixed(2)
                                    .replace(/\.00$/, "");
                                }
                              }

                              return {
                                ...prev,
                                [p]: {
                                  ...pData,
                                  amount: newAmount,
                                  commission: newCommission,
                                  clientAmount: newClientAmount,
                                },
                              };
                            });
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

          <div className="mt-6 pt-4 border-t space-y-4">
            <div className="flex items-center">
              <label className="flex items-center space-x-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-md border border-gray-200">
                <input
                  type="checkbox"
                  checked={isValidated}
                  onChange={(e) => setIsValidated(e.target.checked)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500 w-5 h-5"
                />
                <span className="text-sm font-medium text-gray-700">
                  Valider cette réservation
                </span>
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
                      const isSelected =
                        star <= (hoverRating !== null ? hoverRating : rating);
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
                                ? "fill-amber-400 text-amber-500"
                                : "text-gray-300 fill-transparent"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs font-semibold text-amber-600 ml-2">
                      {rating === 1 && "Très décevant"}
                      {rating === 2 && "Moyen"}
                      {rating === 3 && "Bon"}
                      {rating === 4 && "Excellent"}
                      {rating === 5 && "Parfait"}
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

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-2">
              <div>
                {confirmDelete ? (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-red-50 p-2 rounded-md border border-red-200">
                    <span className="text-sm text-red-700 font-semibold text-center sm:text-left">
                      Supprimer la réservation ?
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleDeleteAll}
                        className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded font-bold transition-colors shadow-sm"
                      >
                        Oui
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="bg-white hover:bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded border border-gray-300 transition-colors"
                      >
                        Non
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:text-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded-md font-semibold text-sm transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer la réservation
                  </button>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
