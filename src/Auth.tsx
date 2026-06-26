import React, { useEffect, useState } from 'react';
import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la connexion');
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Quick check for allowed emails (client side visual check, real check is in rules)
  const isAllowed = user && (
    user.email === 'fdeleflie@gmail.com' ||
    user.email?.toLowerCase().includes('karine') ||
    user.email?.toLowerCase().includes('deleflie')
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">LocaTrack</h1>
          <p className="text-gray-600 mb-6">Connectez-vous pour accéder à la gestion de vos revenus.</p>
          <button
            onClick={handleLogin}
            className="w-full flex justify-center items-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <LogIn className="w-4 h-4 mr-2" />
            Connexion avec Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 text-center max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Accès Refusé</h1>
          <p className="text-gray-600 mb-6">Votre compte ({user.email}) n'est pas autorisé à accéder à cette application.</p>
          <button
            onClick={handleLogout}
            className="w-full flex justify-center items-center bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Déconnexion
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {children}
    </>
  );
}
