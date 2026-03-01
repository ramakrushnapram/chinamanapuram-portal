import { createContext, useContext, useEffect, useState } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

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
    /* Reload to get updated displayName */
    await cred.user.reload();
    /* Store extra profile fields in localStorage */
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

  /* Logout */
  async function logout() {
    return signOut(auth);
  }

  const value = { user, loading, signIn, signInWithGoogle, signUp, logout, updateDisplayName, saveProfile, loadProfile };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
