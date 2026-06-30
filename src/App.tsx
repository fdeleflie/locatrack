import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './store';
import { DataEntry } from './components/DataEntry';
import { Dashboard } from './components/Dashboard';
import { SettingsView } from './components/Settings';
import { DataManagement } from './components/DataManagement';
import { ValidationList } from './components/ValidationList';
import { Calculator, Settings, BarChart2, CalendarDays, LogOut, Database, CheckSquare } from 'lucide-react';
import { AuthWrapper } from './Auth';
import { auth } from './firebase';
import { signOut } from 'firebase/auth';

type Tab = 'saisie' | 'avalider' | 'synthese' | 'parametres' | 'donnees';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('saisie');
  const { state } = useStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header & Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Calculator className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">LocaTrack</h1>
            </div>
            <nav className="flex items-center space-x-1 sm:space-x-4">
              <button
                onClick={() => setActiveTab('saisie')}
                className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'saisie'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CalendarDays className="w-4 h-4 mr-1 sm:mr-2" />
                <span>Saisie</span>
              </button>
              <button
                onClick={() => setActiveTab('avalider')}
                className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'avalider'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <CheckSquare className="w-4 h-4 mr-1 sm:mr-2" />
                <span>À valider</span>
              </button>
              <button
                onClick={() => setActiveTab('synthese')}
                className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'synthese'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <BarChart2 className="w-4 h-4 mr-1 sm:mr-2" />
                <span>Synthèse</span>
              </button>
              <button
                onClick={() => setActiveTab('parametres')}
                className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'parametres'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Paramètres</span>
              </button>
              <button
                onClick={() => setActiveTab('donnees')}
                className={`flex items-center px-2 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'donnees'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Database className="w-4 h-4 mr-1 sm:mr-2" />
                <span>Données</span>
              </button>
              
              <div className="hidden sm:block border-l border-gray-200 h-6 mx-2"></div>
              
              <button
                onClick={() => signOut(auth)}
                className="flex items-center text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-2 py-2 rounded-md text-sm font-medium transition-colors"
                title="Déconnexion"
              >
                <span className="hidden sm:inline mr-2 text-xs truncate max-w-[120px] lg:max-w-none">{auth.currentUser?.email}</span>
                <LogOut className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'saisie' && <DataEntry />}
        {activeTab === 'avalider' && <ValidationList />}
        {activeTab === 'synthese' && <Dashboard />}
        {activeTab === 'parametres' && <SettingsView />}
        {activeTab === 'donnees' && <DataManagement />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthWrapper>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </AuthWrapper>
  );
}
