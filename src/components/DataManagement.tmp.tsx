import React, { useState, useRef } from 'react';
import { useStore } from '../store';
import { Download, Upload, AlertTriangle, Trash2, CheckCircle, Database, HelpCircle } from 'lucide-react';
import { Transaction, Settings } from '../types';

export function DataManagement() {
  const { state, clearDatabase, importTransactionsSmart } = useStore();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ transactions?: Transaction[], settings?: Settings } | null>(null);
  const [strategy, setStrategy] = useState<'skip' | 'overwrite' | 'all'>('skip');
  const [importSettings, setImportSettings] = useState(true);
  
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; updated: number; settingsImported: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  // Clear Database State
  const [clearInput, setClearInput] = useState('');
  const [clearConfirmed, setClearConfirmed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export Logic
  const handleExport = () => {
    try {
      const exportObject = {
        version: "1.0",
        exportedAt: new Date().toISOString(),
        transactions: state.transactions,
        settings: state.settings,
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `locatrack_export_${dateStr}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setStatus({
        type: 'success',
        message: 'Vos données ont été exportées avec succès sous forme de fichier JSON.'
      });
      setImportResult(null);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Erreur lors de l'exportation: ${err.message}`
      });
    }
  };

  // Import File Selection & Parsing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setStatus(null);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Handle files exported by our system or raw transactions arrays
        let transactions: Transaction[] = [];
        let settings: Settings | undefined = undefined;

        if (json && Array.isArray(json)) {
          transactions = json;
        } else if (json && typeof json === 'object') {
          transactions = json.transactions || [];
          settings = json.settings;
        }

        setParsedData({ transactions, settings });
      } catch (err: any) {
        setStatus({
          type: 'error',
          message: `Erreur de lecture du fichier JSON : ${err.message}`
        });
        setParsedData(null);
        setImportFile(null);
      }
    };
    reader.readAsText(file);
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === "application/json") {
      setImportFile(file);
      setStatus(null);
      setImportResult(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          let transactions: Transaction[] = [];
          let settings: Settings | undefined = undefined;

          if (json && Array.isArray(json)) {
            transactions = json;
          } else if (json && typeof json === 'object') {
            transactions = json.transactions || [];
            settings = json.settings;
          }

          setParsedData({ transactions, settings });
        } catch (err: any) {
          setStatus({
            type: 'error',
            message: `Erreur de lecture du fichier JSON : ${err.message}`
          });
          setParsedData(null);
          setImportFile(null);
        }
      };
      reader.readAsText(file);
    } else {
      setStatus({
        type: 'error',
        message: 'Veuillez déposer un fichier au format JSON.'
      });
    }
  };

  // Trigger Import Action
  const handleImport = async () => {
    if (!parsedData || !parsedData.transactions) return;

    try {
      setLoading(true);
      setStatus(null);

      const res = await importTransactionsSmart(
        parsedData.transactions,
        strategy,
        importSettings ? parsedData.settings : undefined
      );

      setImportResult(res);
      setStatus({
        type: 'success',
        message: 'Importation terminée avec succès !'
      });

      // Clear import selection state
      setImportFile(null);
      setParsedData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Erreur d'importation : ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  // Clear Database Logic
  const handleClearDatabase = async () => {
    if (clearInput !== 'VIDER') return;

    try {
      setLoading(true);
      await clearDatabase();
      setClearInput('');
      setClearConfirmed(true);
      setStatus({
        type: 'success',
        message: 'La base de données a été vidée avec succès. Toutes vos réservations ont été supprimées.'
      });
      setImportResult(null);
      setTimeout(() => setClearConfirmed(false), 5000);
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: `Erreur lors de la suppression de la base : ${err.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Database className="w-6 h-6 text-blue-600" />
          Gestion des données
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Gérez la sauvegarde, la restauration, la détection des doublons et la réinitialisation de votre base de données LocaTrack.
        </p>
      </div>

      {/* Global Status Banner */}
      {status && (
        <div className={`p-4 rounded-lg flex items-start gap-3 border ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <CheckCircle className={`w-5 h-5 shrink-0 ${status.type === 'success' ? 'text-green-600' : 'text-red-600'}`} />
          <div>
            <p className="font-medium">{status.message}</p>
            {status.type === 'success' && importResult && (
              <div className="mt-2 text-sm text-green-700 space-y-1">
                <p>• <strong>{importResult.imported}</strong> nouvelles réservations importées.</p>
                <p>• <strong>{importResult.updated}</strong> réservations existantes mises à jour.</p>
                <p>• <strong>{importResult.skipped}</strong> doublons ignorés.</p>
                {importResult.settingsImported && <p>• Configuration de l'application (plateformes, taxes et coûts) importée.</p>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Export Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2 border-b pb-2">
              <Download className="w-5 h-5 text-blue-500" />
              Exporter la base de données
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Téléchargez une sauvegarde complète contenant l'intégralité de vos réservations, ainsi que vos réglages personnalisés (plateformes de réservation, codes couleurs associés, investissements immobiliers et grilles de taxes annuelles).
            </p>
            <div className="bg-gray-50 border border-gray-100 rounded-md p-3 mb-6">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Réservations enregistrées:</span>
                <span className="font-semibold text-gray-800">{state.transactions.length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Plateformes actives:</span>
                <span className="font-semibold text-gray-800">{state.settings.platforms.length}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Coûts d'investissement:</span>
                <span className="font-semibold text-gray-800">{state.settings.houseCosts.length}</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleExport}
            className="w-full flex justify-center items-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter mes données en JSON
          </button>
        </div>

        {/* Import Card */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-2 flex items-center gap-2 border-b pb-2">
            <Upload className="w-5 h-5 text-emerald-500" />
            Importer des données
          </h3>
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            Glissez-déposez ou sélectionnez un fichier de sauvegarde au format <code>.json</code> pour restaurer vos réservations et réglages.
          </p>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              importFile ? 'border-emerald-500 bg-emerald-50/20' : 'border-gray-300 hover:border-blue-400 bg-gray-50'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            <Upload className={`w-8 h-8 mx-auto mb-2 ${importFile ? 'text-emerald-500' : 'text-gray-400'}`} />
            {importFile ? (
              <div>
                <p className="text-sm font-semibold text-emerald-800">{importFile.name}</p>
                <p className="text-xs text-emerald-600 mt-1">{(importFile.size / 1024).toFixed(1)} Ko</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-gray-700">Sélectionner un fichier de sauvegarde</p>
                <p className="text-xs text-gray-500 mt-1">Format JSON accepté</p>
              </div>
            )}
          </div>

          {/* Parsed File Options */}
          {parsedData && (
            <div className="mt-4 p-4 border border-gray-200 rounded-md bg-gray-50 space-y-4">
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-semibold text-gray-800">Contenu détecté dans le fichier :</p>
                <p>• <strong>{parsedData.transactions?.length || 0}</strong> réservations / lignes de revenus.</p>
                {parsedData.settings && <p>• <strong>{parsedData.settings.platforms?.length || 0}</strong> plateformes et autres configurations de réglages.</p>}
              </div>

              {/* Import Options / Duplicate strategy */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                    Gestion des doublons
                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" title="Un doublon est détecté sur le même ID unique, ou sur la même date avec une plateforme et un montant identiques." />
                  </label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as any)}
                    className="w-full border border-gray-300 rounded-md py-1.5 px-2 text-xs focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="skip">Ignorer les doublons (Recommandé)</option>
                    <option value="overwrite">Écraser les doublons existants</option>
                    <option value="all">Tout importer (Générer des copies pour tous)</option>
                  </select>
                </div>

                {parsedData.settings && (
                  <label className="flex items-center space-x-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={importSettings}
                      onChange={(e) => setImportSettings(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 text-xs"
                    />
                    <span className="text-xs text-gray-700 font-medium">Importer également la configuration de l'application</span>
                  </label>
                )}
              </div>

              <button
                onClick={handleImport}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-md shadow-sm transition-colors mt-2"
              >
                {loading ? 'Importation en cours...' : 'Lancer l\'importation'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone / Clear Database */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-red-200 bg-red-50/20">
        <h3 className="text-lg font-medium text-red-900 mb-2 flex items-center gap-2 border-b border-red-100 pb-2">
          <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
          Zone de danger : Vider la base de données
        </h3>
        <p className="text-sm text-red-800 leading-relaxed mb-4">
          Cette action est <strong>irréversible</strong>. Elle supprimera l'intégralité de vos réservations et revenus enregistrés et réinitialisera la configuration globale (plateformes, grilles d'impôts et investissements de maison) à leurs valeurs d'origine. Veuillez exporter vos données avant de procéder si vous souhaitez conserver une sauvegarde.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 items-end max-w-lg">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-red-800 mb-1">
              Saisissez le mot <strong>VIDER</strong> pour confirmer :
            </label>
            <input
              type="text"
              placeholder="Saisissez VIDER ici"
              value={clearInput}
              onChange={(e) => setClearInput(e.target.value)}
              className="w-full border border-red-300 rounded-md py-2 px-3 text-sm focus:ring-red-500 focus:border-red-500 bg-white"
            />
          </div>
          <button
            onClick={handleClearDatabase}
            disabled={clearInput !== 'VIDER' || loading}
            className="flex justify-center items-center bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-5 rounded-md shadow-sm disabled:opacity-40 transition-colors h-[38px] shrink-0"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Vider toute la base de données
          </button>
        </div>
        {clearConfirmed && (
          <p className="text-xs text-green-700 font-semibold mt-2">
            ✓ Base de données réinitialisée.
          </p>
        )}
      </div>
    </div>
  );
}
