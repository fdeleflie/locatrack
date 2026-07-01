import React, { useState, useEffect } from "react";
import { useStore } from "../store";
import {
  Plus,
  Trash2,
  Save,
  Edit2,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";

const currentYear = new Date().getFullYear().toString();

export function SettingsView() {
  const {
    state,
    updateSettings,
    addHouseCost,
    removeHouseCost,
    renamePlatform,
  } = useStore();
  const { settings } = state;

  const [selectedTaxesYear, setSelectedTaxesYear] = useState(currentYear);
  const [showFormulas, setShowFormulas] = useState(false);

  const [csgRate, setCsgRate] = useState("");
  const [taxRate, setTaxRate] = useState("");
  const [abattementRate, setAbattementRate] = useState("");
  const [chargeParNuit, setChargeParNuit] = useState("");
  const [chargeFonciere, setChargeFonciere] = useState("");

  useEffect(() => {
    const taxes = settings.yearlyTaxes?.[selectedTaxesYear];
    if (taxes) {
      setCsgRate(taxes.csgRate.toString());
      setTaxRate(taxes.taxRate.toString());
      setAbattementRate(taxes.abattementRate.toString());
      setChargeParNuit(taxes.chargeParNuit.toString());
      setChargeFonciere(taxes.chargeFonciere.toString());
    } else {
      // Find previous year if current doesn't exist
      const prevYear = (parseInt(selectedTaxesYear) - 1).toString();
      const prevTaxes = settings.yearlyTaxes?.[prevYear];
      if (prevTaxes) {
        setCsgRate(prevTaxes.csgRate.toString());
        setTaxRate(prevTaxes.taxRate.toString());
        setAbattementRate(prevTaxes.abattementRate.toString());
        setChargeParNuit(prevTaxes.chargeParNuit.toString());
        setChargeFonciere(prevTaxes.chargeFonciere.toString());
      } else {
        // Defaults
        setCsgRate("18.6");
        setTaxRate("11");
        setAbattementRate("70");
        setChargeParNuit("5");
        setChargeFonciere("383");
      }
    }
  }, [selectedTaxesYear, settings.yearlyTaxes]);

  const [newPlatform, setNewPlatform] = useState("");
  const [newPlatformColor, setNewPlatformColor] = useState("#3b82f6");
  const [editingPlatform, setEditingPlatform] = useState<{
    old: string;
    new: string;
    color: string;
  } | null>(null);

  const [newCostName, setNewCostName] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");
  const [deletingCostId, setDeletingCostId] = useState<string | null>(null);

  const handleSaveTaxes = () => {
    updateSettings({
      yearlyTaxes: {
        ...settings.yearlyTaxes,
        [selectedTaxesYear]: {
          csgRate: parseFloat(csgRate) || 0,
          taxRate: parseFloat(taxRate) || 0,
          abattementRate: parseFloat(abattementRate) || 0,
          chargeParNuit: parseFloat(chargeParNuit) || 0,
          chargeFonciere: parseFloat(chargeFonciere) || 0,
        },
      },
    });
    alert(`Paramètres enregistrés pour l'année ${selectedTaxesYear}.`);
  };

  const handleAddPlatform = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlatform && !settings.platforms.includes(newPlatform)) {
      updateSettings({
        platforms: [...settings.platforms, newPlatform],
        platformColors: {
          ...settings.platformColors,
          [newPlatform]: newPlatformColor,
        },
      });
      setNewPlatform("");
      setNewPlatformColor("#3b82f6");
    }
  };

  const handleSaveEditPlatform = () => {
    if (editingPlatform) {
      if (editingPlatform.new !== editingPlatform.old) {
        renamePlatform(editingPlatform.old, editingPlatform.new);
      }

      // Update color regardless of name change
      updateSettings({
        platformColors: {
          ...settings.platformColors,
          [editingPlatform.new]: editingPlatform.color,
        },
      });

      setEditingPlatform(null);
    }
  };

  const handleRemovePlatform = (p: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${p} ?`)) {
      const newColors = { ...settings.platformColors };
      delete newColors[p];

      updateSettings({
        platforms: settings.platforms.filter((plat) => plat !== p),
        platformColors: newColors,
      });
    }
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCostName && newCostAmount) {
      addHouseCost({ name: newCostName, amount: parseFloat(newCostAmount) });
      setNewCostName("");
      setNewCostAmount("");
    }
  };

  const years = Array.from({ length: 10 }, (_, i) =>
    (parseInt(currentYear) - 5 + i).toString(),
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-800">Paramètres</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Taxes and Charges */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-medium text-gray-900">
              Taxes & Charges
            </h3>
            <select
              value={selectedTaxesYear}
              onChange={(e) => setSelectedTaxesYear(e.target.value)}
              className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                CSG (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={csgRate}
                onChange={(e) => setCsgRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Impôt sur le revenu (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Abattement Forfaitaire (%) (ex: 70% pour meublé)
              </label>
              <input
                type="number"
                step="0.1"
                value={abattementRate}
                onChange={(e) => setAbattementRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Charge courante par nuit (€)
              </label>
              <input
                type="number"
                step="0.1"
                value={chargeParNuit}
                onChange={(e) => setChargeParNuit(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Charge foncière annuelle (€)
              </label>
              <input
                type="number"
                value={chargeFonciere}
                onChange={(e) => setChargeFonciere(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleSaveTaxes}
              className="w-full flex justify-center items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              Sauvegarder pour {selectedTaxesYear}
            </button>
          </div>
        </div>

        {/* Platforms */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-fit">
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
            Plateformes
          </h3>
          <ul className="space-y-2 mb-4">
            {settings.platforms.map((p) => {
              const isEditing = editingPlatform?.old === p;
              return (
                <li
                  key={p}
                  className="flex flex-col bg-gray-50 px-3 py-2 rounded-md border border-gray-100"
                >
                  <div className="flex items-center justify-between w-full">
                    {isEditing ? (
                      <div className="flex flex-1 items-center gap-2">
                        <input
                          type="color"
                          value={editingPlatform.color}
                          onChange={(e) =>
                            setEditingPlatform({
                              ...editingPlatform,
                              color: e.target.value,
                            })
                          }
                          className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                        />
                        <input
                          type="text"
                          value={editingPlatform.new}
                          onChange={(e) =>
                            setEditingPlatform({
                              ...editingPlatform,
                              new: e.target.value,
                            })
                          }
                          className="flex-1 border border-gray-300 rounded py-1 px-2 text-sm"
                        />
                        <button
                          onClick={handleSaveEditPlatform}
                          className="text-green-600 hover:text-green-800"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingPlatform(null)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                settings.platformColors?.[p] || "#ccc",
                            }}
                          />
                          <span className="text-sm font-medium text-gray-700">
                            {p}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setEditingPlatform({
                                old: p,
                                new: p,
                                color:
                                  settings.platformColors?.[p] || "#cccccc",
                              })
                            }
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemovePlatform(p)}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="mt-2 pt-2 border-t border-gray-200 flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            id={`fee-active-${p}`}
                            checked={settings.platformFees?.[p]?.active || false}
                            onChange={(e) => {
                              updateSettings({
                                platformFees: {
                                  ...settings.platformFees,
                                  [p]: {
                                    percentage:
                                      settings.platformFees?.[p]?.percentage || 0,
                                    active: e.target.checked,
                                  },
                                },
                              });
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                          />
                          <label
                            htmlFor={`fee-active-${p}`}
                            className="text-gray-600 cursor-pointer"
                          >
                            Calcul auto. des frais
                          </label>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            placeholder="0"
                            value={settings.platformFees?.[p]?.percentage || ""}
                            onChange={(e) => {
                              updateSettings({
                                platformFees: {
                                  ...settings.platformFees,
                                  [p]: {
                                    active:
                                      settings.platformFees?.[p]?.active || false,
                                    percentage: parseFloat(e.target.value) || 0,
                                  },
                                },
                              });
                            }}
                            disabled={!settings.platformFees?.[p]?.active}
                            className="w-16 border border-gray-300 rounded py-0.5 px-1.5 text-xs focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
                          />
                          <span
                            className={`text-xs ${settings.platformFees?.[p]?.active ? "text-gray-700" : "text-gray-400"}`}
                          >
                            %
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs pt-1 border-t border-gray-100">
                        <input
                          type="checkbox"
                          id={`exclude-fiscal-${p}`}
                          checked={settings.platformExcludeFiscal?.[p] || false}
                          onChange={(e) => {
                            updateSettings({
                              platformExcludeFiscal: {
                                ...settings.platformExcludeFiscal,
                                [p]: e.target.checked,
                              },
                            });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <label
                          htmlFor={`exclude-fiscal-${p}`}
                          className="text-gray-600 cursor-pointer"
                        >
                          Exclure du calcul du revenu fiscal
                        </label>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <form onSubmit={handleAddPlatform} className="flex gap-2">
            <input
              type="color"
              value={newPlatformColor}
              onChange={(e) => setNewPlatformColor(e.target.value)}
              className="w-10 h-10 rounded cursor-pointer border-0 p-0"
            />
            <input
              type="text"
              placeholder="Nouvelle plateforme..."
              value={newPlatform}
              onChange={(e) => setNewPlatform(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <button
              type="submit"
              className="bg-gray-800 text-white px-3 py-2 rounded-md hover:bg-gray-900 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* House Costs */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
          Coût de la maison (Investissement)
        </h3>

        <form onSubmit={handleAddCost} className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Désignation
            </label>
            <input
              type="text"
              required
              value={newCostName}
              onChange={(e) => setNewCostName(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="ex: Rénovation façade"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Montant (€)
            </label>
            <input
              type="number"
              required
              value={newCostAmount}
              onChange={(e) => setNewCostAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center h-[38px]"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter
          </button>
        </form>

        <div className="overflow-hidden border border-gray-200 rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Désignation
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Montant
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings.houseCosts.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                    {c.name}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                    {c.amount.toLocaleString()} €
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                    {deletingCostId === c.id ? (
                      <div className="flex items-center justify-end gap-1 bg-red-50 p-1 rounded-md border border-red-200 inline-flex">
                        <span className="text-xs text-red-700 font-medium mr-1">
                          Supprimer ?
                        </span>
                        <button
                          onClick={() => {
                            removeHouseCost(c.id);
                            setDeletingCostId(null);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white text-xs px-1.5 py-0.5 rounded transition-colors"
                          title="Confirmer"
                        >
                          Oui
                        </button>
                        <button
                          onClick={() => setDeletingCostId(null)}
                          className="bg-white hover:bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded border border-gray-300 transition-colors"
                          title="Annuler"
                        >
                          Non
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeletingCostId(c.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                  Total Investissement
                </td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {settings.houseCosts
                    .reduce((acc, curr) => acc + curr.amount, 0)
                    .toLocaleString()}{" "}
                  €
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Explications des calculs */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <button
          onClick={() => setShowFormulas(!showFormulas)}
          className="w-full flex items-center justify-between text-left focus:outline-none"
        >
          <div className="flex items-center">
            <Calculator className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Méthodes de calcul & Formules
            </h2>
          </div>
          {showFormulas ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {showFormulas && (
          <div className="mt-6 space-y-4 text-sm text-gray-600 bg-gray-50 p-4 rounded-md border border-gray-100">
            <div>
              <h4 className="font-semibold text-gray-900">Revenus Brut</h4>
              <p>
                Somme des montants perçus{" "}
                <em>
                  (Montant versé par le locataire - Commission - Frais
                  bancaires)
                </em>{" "}
                pour chaque réservation.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Revenus Déclarés</h4>
              <p>
                Revenus Brut - Revenus de la plateforme "Black" (les nuits en
                direct ou non déclarées).
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">
                Impôts et Taxes Estimés
              </h4>
              <p>
                <code>
                  Revenus Déclarés × (Taux d'abattement LMNP / 100) × (Taux CSG
                  / 100)
                </code>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Charges Variables</h4>
              <p>
                <code>Nombre total de nuits × Charge forfaitaire par nuit</code>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Revenus Net</h4>
              <p>
                <code>
                  Revenus Brut - Impôts estimés - Charges Variables - Charges
                  Fixes (Taxe foncière)
                </code>
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Taux d'occupation</h4>
              <p>
                <code>
                  (Nombre de nuits réservées / Nombre de jours écoulés) × 100
                </code>
              </p>
              <p className="text-xs italic mt-1 text-gray-500">
                Pour une année passée, le nombre de jours écoulés est de 365 ou
                366. Pour l'année en cours, il s'agit du nombre de jours entre
                le 1er janvier et la date du jour.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Revenu Fiscal</h4>
              <p>
                Correspond à la somme des montants imposables de chaque
                transaction (Généralement le montant total payé par le client
                avant les commissions, selon la fiscalité de la plateforme).
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
