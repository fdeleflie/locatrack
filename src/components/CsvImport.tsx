import React, { useState } from 'react';
import { useStore } from '../store';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Transaction } from '../types';

const parseFrenchDate = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split(' ');
  if (parts.length < 4) return null;
  const day = parts[1].padStart(2, '0');
  const monthStr = parts[2].replace('.', '').toLowerCase();
  const year = parts[3].length === 2 ? '20' + parts[3] : parts[3];
  
  const months: Record<string, string> = {
    'janv': '01', 'févr': '02', 'mars': '03', 'avr': '04', 'mai': '05', 'juin': '06',
    'juil': '07', 'août': '08', 'sept': '09', 'oct': '10', 'nov': '11', 'déc': '12'
  };
  
  const month = months[monthStr];
  if (!month) return null;
  
  return `${year}-${month}-${day}`;
};

const standardizePlatform = (p: string) => {
  const lower = p.toLowerCase().trim();
  if (lower.includes('air') && lower.includes('bnb')) return 'Airbnb';
  if (lower === 'lbc') return 'Lbc';
  if (lower === 'booking') return 'Booking';
  if (lower === 'black') return 'Black';
  return p.trim();
};

export function CsvImport() {
  const { state, importTransactions } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    Papa.parse(file, {
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const rows = results.data as string[][];
          const newTransactions: Transaction[] = [];

          // Skip header rows (first 3 rows roughly)
          const dataRows = rows.slice(3);

          dataRows.forEach((row) => {
            const extract = (dateCol: number, amountCol: number, platformCol: number) => {
              const dateStr = row[dateCol];
              const amountStr = row[amountCol];
              const platformStr = row[platformCol];

              if (dateStr && amountStr && platformStr && amountStr.trim() !== '') {
                const parsedDate = parseFrenchDate(dateStr);
                const amount = parseFloat(amountStr.replace(',', '.'));
                
                if (parsedDate && !isNaN(amount)) {
                  newTransactions.push({
                    id: Math.random().toString(36).substring(2, 9),
                    date: parsedDate,
                    amount,
                    platform: standardizePlatform(platformStr)
                  });
                }
              }
            };

            // Extract for 2026, 2025, 2024, 2023
            extract(0, 1, 2);   // 2026
            extract(5, 6, 7);   // 2025
            extract(10, 11, 12); // 2024
            extract(15, 16, 17); // 2023
          });

          if (newTransactions.length > 0) {
            importTransactions(newTransactions);
            setSuccess(`${newTransactions.length} revenus ont été importés avec succès !`);
          } else {
            setError("Aucune donnée valide trouvée. Vérifiez le format du CSV.");
          }
        } catch (err) {
          console.error(err);
          setError("Erreur lors de l'analyse du fichier CSV.");
        } finally {
          setLoading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">Importer des données historiques</h3>
      <p className="text-sm text-gray-600 mb-4">
        Sélectionnez votre fichier CSV (issu de votre tableur Excel) pour charger les historiques de revenus (2023 à 2026).
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md flex items-center text-sm">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md flex items-center text-sm">
          <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {loading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
            )}
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Cliquez pour importer</span> ou glissez-déposez
            </p>
            <p className="text-xs text-gray-500">Fichier CSV uniquement</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept=".csv" 
            onChange={handleFileUpload}
            disabled={loading}
          />
        </label>
      </div>
    </div>
  );
}
