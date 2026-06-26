import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAJdf0-pLYW_h5Z4GUsOjweu5jqhzXQfbg",
  authDomain: "localtrack-eef65.firebaseapp.com",
  projectId: "localtrack-eef65",
  storageBucket: "localtrack-eef65.firebasestorage.app",
  messagingSenderId: "904583979953",
  appId: "1:904583979953:web:c37df86939cc64eb839390",
  measurementId: "G-1ZXXHRSPFX"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
