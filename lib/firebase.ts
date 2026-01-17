import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  collection,
  getDocs,
  query,
  where,
  setDoc,
  Timestamp
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

// Password reset (sends reset email via Gmail/Email provider)
export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

// Google Sign-In
const googleProvider = new GoogleAuthProvider();
/**
 * Google sign-in.
 * Uses Popup by default, but falls back to Redirect when the browser blocks popups
 * (common on iOS/Safari/in-app browsers).
 *
 * Returns:
 * - UserCredential when popup succeeds
 * - null when redirect flow is started (handle via getGoogleRedirectResult)
 */
export const signInWithGoogle = async () => {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err: any) {
    // Fallback for mobile browsers that block popups
    if (
      err?.code === 'auth/popup-blocked' ||
      err?.code === 'auth/operation-not-supported-in-this-environment' ||
      err?.code === 'auth/cancelled-popup-request'
    ) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw err;
  }
};

// When using redirect sign-in, call this after page load to complete login.
export const getGoogleRedirectResult = () => getRedirectResult(auth);

// Used when an email already exists with a different sign-in method.
// Flow:
// 1) User tries Google sign-in -> gets "auth/account-exists-with-different-credential" with a pending credential
// 2) User signs in with password
// 3) Link the pending Google credential to the currently signed-in user
export const getSignInMethodsForEmail = (email: string) => {
  return fetchSignInMethodsForEmail(auth, email);
};

export const linkPendingCredentialToCurrentUser = async (pendingCredential: any) => {
  if (!auth.currentUser) throw new Error('No authenticated user to link credential to.');
  return linkWithCredential(auth.currentUser, pendingCredential);
};

// Ensure there is a Firestore user doc for OAuth-first users.
// If the user doc does not exist, create a basic vendor profile in "pending" status.
export const ensureUserDoc = async (user: { uid: string; email: string | null; displayName?: string | null }) => {
  const uid = user.uid;
  const email = (user.email || '').toLowerCase();
  if (!email) return;

  const existing = await getDoc(doc(db, 'users', uid));
  if (existing.exists()) return;

  await setDoc(doc(db, 'users', uid), {
    id: uid,
    email,
    name: user.displayName || 'User',
    role: 'vendor',
    companyId: `company_${uid}`,
    status: 'pending',
    createdAt: Timestamp.now(),
    createdBy: 'google-oauth',
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
