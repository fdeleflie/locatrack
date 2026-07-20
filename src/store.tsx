import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, Settings, Transaction, HouseCost, YearlyTaxRates } from './types';
import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const currentYear = new Date().getFullYear().toString();

const defaultSettings: Settings = {
  yearlyTaxes: {
    [currentYear]: {
      csgRate: 18.6,
      taxRate: 11,
      abattementRate: 70,
      chargeParNuit: 5,
      chargeFonciere: 383,
    }
  },
  platforms: ['Airbnb', 'Booking', 'Black', 'Lbc'],
  platformColors: {
    'Airbnb': '#EF4444', // Red
    'Booking': '#3B82F6', // Blue
    'Black': '#10B981', // Emerald
    'Lbc': '#F59E0B' // Amber
  },
  houseCosts: [
    { id: '1', name: 'Maison + frais de notaire', amount: 342000 },
    { id: '2', name: 'Façade', amount: 1000 },
    { id: '3', name: 'Abris de jardin', amount: 2000 },
  ],
};

const initialTransactions: Transaction[] = [];

interface StoreContextType {
  state: AppState;
  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, t: Partial<Transaction>) => void;
  removeTransaction: (id: string) => void;
  batchUpdateTransactions: (
    adds: Omit<Transaction, 'id'>[],
    updates: { id: string; updates: Partial<Transaction> }[],
    removes: string[]
  ) => void;
  updateSettings: (s: Partial<Settings>) => void;
  addHouseCost: (c: Omit<HouseCost, 'id'>) => void;
  removeHouseCost: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  renamePlatform: (oldName: string, newName: string) => void;
  clearDatabase: () => Promise<void>;
  importTransactionsSmart: (
    importedTxs: Transaction[], 
    strategy: 'skip' | 'overwrite' | 'all', 
    importedSettings?: Settings
  ) => Promise<{ imported: number, skipped: number, updated: number, settingsImported: boolean }>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState | null>(null);

  useEffect(() => {
    const docRef = doc(db, 'appData', 'shared');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppState;
        const settings = { ...defaultSettings, ...(data.settings || {}) };
        
        // Migration for yearlyTaxes
        if (!settings.yearlyTaxes || Object.keys(settings.yearlyTaxes).length === 0) {
          settings.yearlyTaxes = {
            [currentYear]: {
              csgRate: settings.csgRate ?? 18.6,
              taxRate: settings.taxRate ?? 11,
              abattementRate: settings.abattementRate ?? 70,
              chargeParNuit: settings.chargeParNuit ?? 5,
              chargeFonciere: settings.chargeFonciere ?? 383,
            }
          };
        }

        // Migration for platformColors
        if (!settings.platformColors) {
          settings.platformColors = defaultSettings.platformColors;
        } else {
          // Update old defaults to new distinct defaults automatically
          const oldDefaultsMatch = 
            settings.platformColors['Airbnb'] === '#FF5A5F' && 
            settings.platformColors['Booking'] === '#003580' &&
            settings.platformColors['Black'] === '#333333' &&
            settings.platformColors['Lbc'] === '#F56B2A';
            
          if (oldDefaultsMatch) {
            settings.platformColors = defaultSettings.platformColors;
          }
        }

        setState({
          transactions: (data.transactions || []).map(t => t.id ? t : { ...t, id: Math.random().toString(36).substring(2, 9) }),
          settings,
        });
      } else {
        const initialState = {
          transactions: initialTransactions,
          settings: defaultSettings,
        };
        setDoc(docRef, initialState);
        setState(initialState);
      }
    }, (error) => {
      console.error("Error fetching state:", error);
    });

    return () => unsubscribe();
  }, []);

  const saveState = async (newState: AppState) => {
    setState(newState);
    const docRef = doc(db, 'appData', 'shared');
    
    // Firestore does not support undefined values.
    // JSON.parse(JSON.stringify()) is a quick way to strip out all undefined fields
    const cleanState = JSON.parse(JSON.stringify(newState));
    
    await setDoc(docRef, cleanState);
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    if (!state) return;
    const newTx = { ...t, id: Math.random().toString(36).substring(2, 9) };
    const newTransactions = [...state.transactions, newTx].sort((a, b) => a.date.localeCompare(b.date));
    saveState({ ...state, transactions: newTransactions });
  };

  const removeTransaction = (id: string) => {
    if (!state) return;
    saveState({
      ...state,
      transactions: state.transactions.filter((t) => t.id !== id),
    });
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    if (!state) return;
    saveState({
      ...state,
      transactions: state.transactions.map((t) => t.id === id ? { ...t, ...updates } : t),
    });
  };

  const batchUpdateTransactions = (
    adds: Omit<Transaction, 'id'>[],
    updates: { id: string; updates: Partial<Transaction> }[],
    removes: string[]
  ) => {
    if (!state) return;
    
    let currentTxs = [...state.transactions];
    
    if (removes.length > 0) {
      const removeSet = new Set(removes);
      currentTxs = currentTxs.filter((t) => !removeSet.has(t.id));
    }
    
    if (updates.length > 0) {
      const updateMap = new Map<string, Partial<Transaction>>();
      updates.forEach((u) => updateMap.set(u.id, u.updates));
      currentTxs = currentTxs.map((t) => {
        if (updateMap.has(t.id)) {
          return { ...t, ...updateMap.get(t.id) };
        }
        return t;
      });
    }
    
    if (adds.length > 0) {
      const newTxs = adds.map((t) => ({
        ...t,
        id: Math.random().toString(36).substring(2, 9),
      }));
      currentTxs = [...currentTxs, ...newTxs];
    }
    
    currentTxs.sort((a, b) => a.date.localeCompare(b.date));
    
    saveState({ ...state, transactions: currentTxs });
  };

  const importTransactions = (newTxs: Transaction[]) => {
    if (!state) return;
    const existingIds = new Set(state.transactions.map(t => t.id));
    const merged = [...state.transactions, ...newTxs.filter(t => !existingIds.has(t.id))];
    merged.sort((a, b) => a.date.localeCompare(b.date));
    saveState({ ...state, transactions: merged });
  };

  const updateSettings = (s: Partial<Settings>) => {
    if (!state) return;
    saveState({
      ...state,
      settings: { ...state.settings, ...s },
    });
  };

  const renamePlatform = (oldName: string, newName: string) => {
    if (!state || !newName || oldName === newName || state.settings.platforms.includes(newName)) return;
    
    const newPlatforms = state.settings.platforms.map(p => p === oldName ? newName : p);
    
    const newColors = { ...state.settings.platformColors };
    if (newColors[oldName]) {
      newColors[newName] = newColors[oldName];
      delete newColors[oldName];
    }

    const newTransactions = state.transactions.map(t => 
      t.platform === oldName ? { ...t, platform: newName } : t
    );

    saveState({
      ...state,
      settings: {
        ...state.settings,
        platforms: newPlatforms,
        platformColors: newColors,
      },
      transactions: newTransactions,
    });
  };

  const addHouseCost = (c: Omit<HouseCost, 'id'>) => {
    if (!state) return;
    saveState({
      ...state,
      settings: {
        ...state.settings,
        houseCosts: [
          ...state.settings.houseCosts,
          { ...c, id: Math.random().toString(36).substring(2, 9) },
        ],
      },
    });
  };

  const removeHouseCost = (id: string) => {
    if (!state) return;
    saveState({
      ...state,
      settings: {
        ...state.settings,
        houseCosts: state.settings.houseCosts.filter((c) => c.id !== id),
      },
    });
  };

  const clearDatabase = async () => {
    const docRef = doc(db, 'appData', 'shared');
    const initialState = {
      transactions: [],
      settings: defaultSettings,
    };
    await setDoc(docRef, initialState);
    setState(initialState);
  };

  const importTransactionsSmart = async (
    importedTxs: Transaction[],
    strategy: 'skip' | 'overwrite' | 'all',
    importedSettings?: Settings
  ) => {
    if (!state) return { imported: 0, skipped: 0, updated: 0, settingsImported: false };

    let imported = 0;
    let skipped = 0;
    let updated = 0;

    const currentTxs = [...state.transactions];
    const newTxs: Transaction[] = [];

    for (const tx of importedTxs) {
      // Clean up transaction from any undefined or invalid structure
      const cleanTx = {
        ...tx,
        id: tx.id || Math.random().toString(36).substring(2, 9),
        date: tx.date || new Date().toISOString().split('T')[0],
        amount: typeof tx.amount === 'number' ? tx.amount : parseFloat(tx.amount as any) || 0,
        platform: tx.platform || 'Airbnb',
      };

      // Match by exact ID or by combination of date, platform, amount
      const existingIdx = currentTxs.findIndex(t => 
        t.id === cleanTx.id || 
        (t.date === cleanTx.date && t.platform === cleanTx.platform && Math.abs(t.amount - cleanTx.amount) < 0.01)
      );

      if (existingIdx !== -1) {
        if (strategy === 'skip') {
          skipped++;
        } else if (strategy === 'overwrite') {
          currentTxs[existingIdx] = { ...currentTxs[existingIdx], ...cleanTx };
          updated++;
        } else {
          // 'all' strategy: generate a new ID and add it
          const newTx = { 
            ...cleanTx, 
            id: Math.random().toString(36).substring(2, 9) 
          };
          newTxs.push(newTx);
          imported++;
        }
      } else {
        // New transaction entirely
        newTxs.push(cleanTx);
        imported++;
      }
    }

    const mergedTransactions = [...currentTxs, ...newTxs].sort((a, b) => a.date.localeCompare(b.date));
    
    let finalSettings = state.settings;
    let settingsImported = false;
    if (importedSettings) {
      finalSettings = {
        ...state.settings,
        ...importedSettings,
        yearlyTaxes: { ...state.settings.yearlyTaxes, ...(importedSettings.yearlyTaxes || {}) },
        platforms: Array.from(new Set([...state.settings.platforms, ...(importedSettings.platforms || [])])),
        platformColors: { ...state.settings.platformColors, ...(importedSettings.platformColors || {}) },
        houseCosts: importedSettings.houseCosts || state.settings.houseCosts
      };
      settingsImported = true;
    }

    await saveState({
      transactions: mergedTransactions,
      settings: finalSettings
    });

    return { imported, skipped, updated, settingsImported };
  };

  if (!state) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <StoreContext.Provider
      value={{
        state,
        addTransaction,
        updateTransaction,
        removeTransaction,
        batchUpdateTransactions,
        updateSettings,
        addHouseCost,
        removeHouseCost,
        importTransactions,
        renamePlatform,
        clearDatabase,
        importTransactionsSmart,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
}

