import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { auth, googleProvider, db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

/* ── Save / load extended profile data (localStorage) ── */
function saveProfile(uid, data) {
  try { localStorage.setItem(`vp_profile_${uid}`, JSON.stringify(data)); } catch (_) {}
}
export function loadProfile(uid) {
  try { return JSON.parse(localStorage.getItem(`vp_profile_${uid}`)) || {}; } catch (_) { return {}; }
}

/* ── Provider ── */
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  /* ── Online presence tracking ── */
  useEffect(() => {
    if (!user) return;

    const presenceRef = doc(db, 'presence', user.uid);

    /* Mark online */
    setDoc(presenceRef, {
      displayName: user.displayName || user.email?.split('@')[0] || 'Villager',
      online:      true,
      lastActive:  serverTimestamp(),
    }, { merge: true }).catch(() => {});

    /* Heartbeat every 2 min to keep presence fresh */
    const heartbeat = setInterval(() => {
      setDoc(presenceRef, { online: true, lastActive: serverTimestamp() }, { merge: true }).catch(() => {});
    }, 2 * 60 * 1000);

    /* Mark offline when user changes (logout) */
    return () => {
      clearInterval(heartbeat);
      setDoc(presenceRef, { online: false }, { merge: true }).catch(() => {});
    };
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Sign in with email + password */
  async function signIn(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  /* Sign in with Google */
  async function signInWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  /* Register new user */
  async function signUp(email, password, displayName, extraData = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await fbUpdateProfile(cred.user, { displayName });
    await cred.user.reload();
    saveProfile(cred.user.uid, { displayName, ...extraData });
    return cred;
  }

  /* Update display name */
  async function updateDisplayName(name) {
    if (!auth.currentUser) return;
    await fbUpdateProfile(auth.currentUser, { displayName: name });
    await auth.currentUser.reload();
    setUser({ ...auth.currentUser });
  }

  /* Logout — marks presence offline first */
  async function logout() {
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'presence', auth.currentUser.uid), { online: false }, { merge: true });
      } catch (_) {}
    }
    return signOut(auth);
  }

  const value = { user, loading, signIn, signInWithGoogle, signUp, logout, updateDisplayName, saveProfile, loadProfile };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
