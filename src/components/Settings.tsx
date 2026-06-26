import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Trash2, Save, Edit2, X, Check } from 'lucide-react';
import { CsvImport } from './CsvImport';

const currentYear = new Date().getFullYear().toString();

export function SettingsView() {
  const { state, updateSettings, addHouseCost, removeHouseCost, renamePlatform } = useStore();
  const { settings } = state;

  const [selectedTaxesYear, setSelectedTaxesYear] = useState(currentYear);

  const [csgRate, setCsgRate] = useState('');
  const [taxRate, setTaxRate] = useState('');
  const [abattementRate, setAbattementRate] = useState('');
  const [chargeParNuit, setChargeParNuit] = useState('');
  const [chargeFonciere, setChargeFonciere] = useState('');

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
        setCsgRate('18.6');
        setTaxRate('11');
        setAbattementRate('70');
        setChargeParNuit('5');
        setChargeFonciere('383');
      }
    }
  }, [selectedTaxesYear, settings.yearlyTaxes]);
  
  const [newPlatform, setNewPlatform] = useState('');
  const [newPlatformColor, setNewPlatformColor] = useState('#3b82f6');
  const [editingPlatform, setEditingPlatform] = useState<{old: string, new: string, color: string} | null>(null);

  const [newCostName, setNewCostName] = useState('');
  const [newCostAmount, setNewCostAmount] = useState('');

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
        }
      }
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
          [newPlatform]: newPlatformColor
        }
      });
      setNewPlatform('');
      setNewPlatformColor('#3b82f6');
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
          [editingPlatform.new]: editingPlatform.color
        }
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
        platformColors: newColors
      });
    }
  };

  const handleAddCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCostName && newCostAmount) {
      addHouseCost({ name: newCostName, amount: parseFloat(newCostAmount) });
      setNewCostName('');
      setNewCostAmount('');
    }
  };

  const years = Array.from({length: 10}, (_, i) => (parseInt(currentYear) - 5 + i).toString());

  return (
    <div className="space-y-8 max-w-4xl">
      <h2 className="text-2xl font-semibold text-gray-800">Paramètres</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Taxes and Charges */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h3 className="text-lg font-medium text-gray-900">Taxes & Charges</h3>
            <select
              value={selectedTaxesYear}
              onChange={(e) => setSelectedTaxesYear(e.target.value)}
              className="border border-gray-300 rounded-md py-1 px-2 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">CSG (%)</label>
              <input
                type="number"
                step="0.1"
                value={csgRate}
                onChange={(e) => setCsgRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Impôt sur le revenu (%)</label>
              <input
                type="number"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Abattement Forfaitaire (%) (ex: 70% pour meublé)</label>
              <input
                type="number"
                step="0.1"
                value={abattementRate}
                onChange={(e) => setAbattementRate(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Charge courante par nuit (€)</label>
              <input
                type="number"
                step="0.1"
                value={chargeParNuit}
                onChange={(e) => setChargeParNuit(e.target.value)}
                className="mt-1 w-full border border-gray-300 rounded-md py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Charge foncière annuelle (€)</label>
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
          <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Plateformes</h3>
          <ul className="space-y-2 mb-4">
            {settings.platforms.map((p) => {
              const isEditing = editingPlatform?.old === p;
              return (
                <li key={p} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md border border-gray-100">
                  {isEditing ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="color"
                        value={editingPlatform.color}
                        onChange={e => setEditingPlatform({...editingPlatform, color: e.target.value})}
                        className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                      />
                      <input
                        type="text"
                        value={editingPlatform.new}
                        onChange={e => setEditingPlatform({...editingPlatform, new: e.target.value})}
                        className="flex-1 border border-gray-300 rounded py-1 px-2 text-sm"
                      />
                      <button onClick={handleSaveEditPlatform} className="text-green-600 hover:text-green-800">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingPlatform(null)} className="text-gray-500 hover:text-gray-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{backgroundColor: settings.platformColors?.[p] || '#ccc'}}
                        />
                        <span className="text-sm font-medium text-gray-700">{p}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingPlatform({
                            old: p, 
                            new: p, 
                            color: settings.platformColors?.[p] || '#cccccc'
                          })}
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
        <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Coût de la maison (Investissement)</h3>
        
        <form onSubmit={handleAddCost} className="flex gap-4 items-end mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Désignation</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Montant (€)</label>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {settings.houseCosts.map((c) => (
                <tr key={c.id}>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">{c.name}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{c.amount.toLocaleString()} €</td>
                  <td className="px-6 py-3 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => removeHouseCost(c.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-medium">
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">Total Investissement</td>
                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                  {settings.houseCosts.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()} €
                </td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      {/* CSV Import */}
      <div className="mt-8">
        <CsvImport />
      </div>
    </div>
  );
}
