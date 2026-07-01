import React, { useState, useRef } from "react";
import { useStore } from "../store";
import Papa from "papaparse";
import {
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileSpreadsheet,
  HelpCircle,
} from "lucide-react";
import { Transaction } from "../types";

export function CsvImport() {
  const { state, importTransactionsSmart } = useStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<"skip" | "overwrite" | "all">(
    "skip",
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCsv = () => {
    try {
      const formatNumber = (num: number | undefined | null) => {
        if (num === undefined || num === null) return "";
        return num.toString().replace(".", ",");
      };

      const exportData = state.transactions.map((t) => ({
        id: t.id,
        date: t.date,
        plateforme: t.platform,
        brut: formatNumber(t.clientAmount !== undefined ? t.clientAmount : t.amount),
        frais_commission: formatNumber(t.commission || 0),
        frais_bancaire: formatNumber(t.bankFee || 0),
        net: formatNumber(t.amount),
        prenom: t.firstName || "",
        nom: t.lastName || "",
        nuits: t.nights || 1,
        adultes: t.adults || "",
        enfants: t.children || "",
        telephone: t.phone || "",
        valide: t.isValidated ? "Oui" : "Non",
        commentaire_validation: t.validationComment || "",
        commentaires: t.comments || "",
      }));

      const csv = Papa.unparse(exportData);
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      const downloadAnchor = document.createElement("a");
      const dateStr = new Date().toISOString().split("T")[0];
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute(
        "download",
        `locatrack_export_${dateStr}.csv`,
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      setSuccess("Exportation CSV réussie !");
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      setError(`Erreur lors de l'exportation : ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false, // Keep as strings to safely parse decimals
      complete: async (results) => {
        try {
          const rows = results.data as any[];
          const newTransactions: Transaction[] = [];

          rows.forEach((row) => {
            const rawDate = row.date || row.Date || row.DATE;
            const rawPlatform =
              row.platform || row.plateforme || row.Plateforme;
            const rawAmount =
              row.amount !== undefined
                ? row.amount
                : row.net !== undefined
                  ? row.net
                  : null;

            if (rawDate && rawPlatform && rawAmount !== null) {
              const parseNumber = (val: any) => {
                if (val === undefined || val === null || val === "")
                  return undefined;
                return parseFloat(String(val).replace(",", "."));
              };

              newTransactions.push({
                id: row.id
                  ? String(row.id)
                  : Math.random().toString(36).substring(2, 9),
                date: String(rawDate),
                amount: parseNumber(rawAmount) || 0,
                platform: String(rawPlatform),
                firstName:
                  row.firstName || row.prenom
                    ? String(row.firstName || row.prenom)
                    : undefined,
                lastName:
                  row.lastName || row.nom
                    ? String(row.lastName || row.nom)
                    : undefined,
                phone:
                  row.phone || row.telephone
                    ? String(row.phone || row.telephone)
                    : undefined,
                nights:
                  row.nights || row.nuits
                    ? parseInt(String(row.nights || row.nuits), 10)
                    : undefined,
                clientAmount: parseNumber(
                  row.clientAmount !== undefined ? row.clientAmount : row.brut,
                ),
                commission: parseNumber(
                  row.commission !== undefined
                    ? row.commission
                    : row.frais_commission,
                ),
                bankFee: parseNumber(
                  row.bankFee !== undefined ? row.bankFee : row.frais_bancaire,
                ),
                isValidated:
                  String(row.isValidated).toLowerCase() === "true" ||
                  String(row.valide).toLowerCase() === "oui",
                validationComment:
                  row.validationComment || row.commentaire_validation
                    ? String(
                        row.validationComment || row.commentaire_validation,
                      )
                    : undefined,
                adults:
                  row.adults || row.adultes
                    ? parseInt(String(row.adults || row.adultes), 10)
                    : undefined,
                children:
                  row.children || row.enfants
                    ? parseInt(String(row.children || row.enfants), 10)
                    : undefined,
                comments:
                  row.comments || row.commentaires
                    ? String(row.comments || row.commentaires)
                    : undefined,
              });
            }
          });

          if (newTransactions.length > 0) {
            const res = await importTransactionsSmart(
              newTransactions,
              strategy,
            );
            setSuccess(
              `${res.imported} réservations importées, ${res.updated} mises à jour, ${res.skipped} ignorées.`,
            );
          } else {
            setError(
              "Aucune donnée valide trouvée. Vérifiez que le CSV contient au moins les colonnes 'date', 'net' (ou 'amount') et 'plateforme' (ou 'platform').",
            );
          }
        } catch (err) {
          console.error(err);
          setError("Erreur lors de l'analyse du fichier CSV.");
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = "";
        }
      },
      error: (err) => {
        setError(err.message);
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
        Import / Export CSV
      </h3>
      <p className="text-sm text-gray-600 mb-6">
        Exportez vos réservations au format CSV pour les utiliser dans un
        tableur (Excel, Google Sheets), ou importez un fichier CSV contenant vos
        données.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="border border-gray-200 rounded-lg p-5 flex flex-col justify-between bg-gray-50">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">
              Exporter en CSV
            </h4>
            <p className="text-xs text-gray-600 mb-4">
              Générez un fichier CSV contenant toutes vos réservations
              actuelles. Idéal pour faire vos propres tableaux de bord ou
              sauvegardes.
            </p>
          </div>
          <button
            onClick={handleExportCsv}
            className="w-full flex justify-center items-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-md shadow-sm transition-colors"
          >
            <Download className="w-4 h-4 mr-2" />
            Télécharger le CSV
          </button>
        </div>

        {/* Import Section */}
        <div className="border border-gray-200 rounded-lg p-5 bg-gray-50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">Importer un CSV</h4>
            </div>
            <p className="text-xs text-gray-600 mb-3">
              Le fichier doit contenir une ligne d'en-tête. Les colonnes
              obligatoires sont <code>date</code>, <code>amount</code>, et{" "}
              <code>platform</code>.
            </p>

            <div className="mb-3">
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                Gestion des doublons
                <HelpCircle
                  className="w-3.5 h-3.5 text-gray-400"
                  title="Choix de la méthode d'importation."
                />
              </label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full border border-gray-300 rounded-md py-1 px-2 text-xs focus:ring-green-500 focus:border-green-500"
              >
                <option value="skip">Ignorer les doublons (Recommandé)</option>
                <option value="overwrite">Écraser les doublons</option>
                <option value="all">Tout importer</option>
              </select>
            </div>
          </div>

          <label
            htmlFor="csv-upload"
            className="flex justify-center items-center w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md shadow-sm transition-colors mt-2 cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Sélectionner un fichier
          </label>
          <input
            id="csv-upload"
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileUpload}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = "";
            }}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
}
