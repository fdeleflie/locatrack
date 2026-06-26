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
  updateSettings: (s: Partial<Settings>) => void;
  addHouseCost: (c: Omit<HouseCost, 'id'>) => void;
  removeHouseCost: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  renamePlatform: (oldName: string, newName: string) => void;
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
        updateSettings,
        addHouseCost,
        removeHouseCost,
        importTransactions,
        renamePlatform,
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

