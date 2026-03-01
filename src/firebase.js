import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

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
  apiKey:            process.env.REACT_APP_FIREBASE_API_KEY            || 'YOUR_API_KEY',
  authDomain:        process.env.REACT_APP_FIREBASE_AUTH_DOMAIN        || 'YOUR_PROJECT.firebaseapp.com',
  projectId:         process.env.REACT_APP_FIREBASE_PROJECT_ID         || 'YOUR_PROJECT_ID',
  storageBucket:     process.env.REACT_APP_FIREBASE_STORAGE_BUCKET     || 'YOUR_PROJECT.appspot.com',
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID|| 'YOUR_SENDER_ID',
  appId:             process.env.REACT_APP_FIREBASE_APP_ID             || 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
