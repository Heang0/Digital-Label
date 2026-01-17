import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  getAdditionalUserInfo,
  linkWithCredential,
  sendPasswordResetEmail,
  deleteUser,
  type UserCredential,
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

// Firebase config via env (set NEXT_PUBLIC_FIREBASE_* for Vercel)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ''
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
// Secondary app/auth (used to create staff users without logging out the current vendor)
const secondaryApp = initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);


// Authentication functions
export const signUp = (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signIn = (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const logOut = () => {
  return signOut(auth);
};

// Password reset (sends an email with a reset link)
export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Google sign-in (popup first, fallback to redirect when popups are blocked)
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const signInWithGoogle = async (): Promise<UserCredential | null> => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (e: any) {
    const code = e?.code;
    if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
      await signInWithRedirect(auth, googleProvider);
      return null; // redirect started
    }
    throw e;
  }
};

export const getGoogleRedirectResult = async (): Promise<UserCredential | null> => {
  return await getRedirectResult(auth);
};

export const isNewGoogleUser = (cred: UserCredential) => {
  return !!getAdditionalUserInfo(cred)?.isNewUser;
};

export const deleteCurrentUser = async () => {
  const u = auth.currentUser;
  if (!u) return;
  await deleteUser(u);
};

// Link a pending Google credential to the currently signed-in user
export const linkPendingCredentialToCurrentUser = async (pendingCredential: any) => {
  const u = auth.currentUser;
  if (!u) throw new Error('No signed in user to link credential');
  return await linkWithCredential(u, pendingCredential);
};

// Ensure a Firestore user document exists (used in some flows)
export const ensureUserDoc = async (args: {
  uid: string;
  email: string | null;
  displayName: string | null;
}) => {
  const ref = doc(db, 'users', args.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  await setDoc(ref, {
    email: args.email || '',
    name: args.displayName || (args.email ? args.email.split('@')[0] : 'User'),
    role: 'vendor',
    createdAt: serverTimestamp(),
  });
};

// Get user data from Firestore
export const getUserData = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        id: userId,
        email: userData.email || '',
        name: userData.name || 'User',
        role: userData.role || 'staff',
        companyId: userData.companyId || null,
        branchId: userData.branchId || null,
        position: userData.position || '',
        permissions: userData.permissions || null,
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};
