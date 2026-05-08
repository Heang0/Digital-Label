import { Request, Response } from 'express';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, updateDoc } from 'firebase/firestore';
import { createNotification } from '../utils/notifications';

// Use Client SDK for Firestore (more robust for local development without Service Account)
const firebaseConfig = {
  apiKey: "AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0",
  authDomain: "digital-label-8620b.firebaseapp.com",
  projectId: "digital-label-8620b",
  storageBucket: "digital-label-8620b.firebasestorage.app",
  messagingSenderId: "342078286952",
  appId: "1:342078286952:web:c125a1ae12edac51029fdd",
  measurementId: "G-QHGBZ7RD29"
};

const app = initializeApp(firebaseConfig, 'controller-app');
const db = getFirestore(app);

export const createVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, companyId, status } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    // Auth creation still uses Admin SDK (this might fail if service account is missing)
    try {
      const userRecord = await getAuth().createUser({
        email,
        password,
        displayName: name,
      });

      await getAuth().setCustomUserClaims(userRecord.uid, { role: 'vendor' });

      // Create user document in Firestore using Client SDK
      await setDoc(doc(db, 'users', userRecord.uid), {
        id: userRecord.uid,
        name,
        email,
        role: 'vendor',
        companyId: companyId || '',
        status: status || 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await createNotification({
        title: 'New Vendor Registered',
        message: `${name} (${companyId}) has just onboarded.`,
        type: 'success'
      });

      res.status(201).json({ message: 'Vendor created successfully', userId: userRecord.uid });
    } catch (authErr: any) {
      // Fallback for local development if Admin SDK fails
      console.warn('Admin Auth creation failed, but Firestore record might be created manually.');
      res.status(500).json({ message: 'Firebase Admin authentication required for new user creation.' });
    }
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Use Client SDK to update Firestore (This will work without Service Account!)
    const userRef = doc(db, 'users', id);
    await setDoc(userRef, {
      ...updates,
      updatedAt: new Date(),
    }, { merge: true });

    // Try to sync with Firebase Auth Profile (Non-critical)
    if (updates.name || updates.photoURL) {
      try {
        const authUpdates: any = {};
        if (updates.name) authUpdates.displayName = updates.name;
        if (updates.photoURL) authUpdates.photoURL = updates.photoURL;
        
        await getAuth().updateUser(id, authUpdates);
      } catch (authError) {
        console.warn('Non-critical: Admin SDK not initialized for Auth sync.');
      }
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error: any) {
    console.error('CRITICAL ERROR UPDATING PROFILE:', error);
    res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
};

export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, companyId, status } = req.body;

    const userRef = doc(db, 'users', id);
    await updateDoc(userRef, {
      name,
      companyId,
      status,
      updatedAt: new Date(),
    });

    try {
      await getAuth().updateUser(id, {
        displayName: name,
      });
    } catch (e) {
      console.warn('Non-critical: Admin Auth sync failed.');
    }

    res.status(200).json({ message: 'Vendor updated successfully' });
  } catch (error: any) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ message: error.message });
  }
};
