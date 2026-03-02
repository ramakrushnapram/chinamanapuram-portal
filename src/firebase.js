import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// ─────────────────────────────────────────────────────────
//  Replace the placeholder values below with your Firebase
//  project credentials from https://console.firebase.google.com
//
//  Create a .env file in the project root with:
//
//  REACT_APP_FIREBASE_API_KEY=your_api_key
//  REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
//  REACT_APP_FIREBASE_PROJECT_ID=your_project_id
//  REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
//  REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
//  REACT_APP_FIREBASE_APP_ID=your_app_id
//
//  Also enable Email/Password and Google providers in:
//  Firebase Console → Authentication → Sign-in method
// ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey:            'AIzaSyBYFuW9HN-ASVrvlGkWyzXNfFBk4WolBUY',
  authDomain:        'chinamanapuram-portal.firebaseapp.com',
  projectId:         'chinamanapuram-portal',
  storageBucket:     'chinamanapuram-portal.firebasestorage.app',
  messagingSenderId: '209699039035',
  appId:             '1:209699039035:web:17b26191987ac2c92cb91e',
};

const app = initializeApp(firebaseConfig);

export const auth    = getAuth(app);
export const db      = getFirestore(app);
export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
