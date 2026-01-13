import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc
} from 'firebase/firestore';

// Your Firebase config - directly in code
const firebaseConfig = {
  apiKey: "AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0",
  authDomain: "digital-label-8620b.firebaseapp.com",
  projectId: "digital-label-8620b",
  storageBucket: "digital-label-8620b.firebasestorage.app",
  messagingSenderId: "342078286952",
  appId: "1:342078286952:web:c125a1ae12edac51029fdd",
  measurementId: "G-QHGBZ7RD29"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);

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
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};