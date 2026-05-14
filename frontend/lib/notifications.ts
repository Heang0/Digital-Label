import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type NotificationType = 'info' | 'warning' | 'success' | 'alert';

export async function createNotification(params: {
  companyId: string;
  branchId: string; // Use 'all' for global company notifications
  title: string;
  message: string;
  type: NotificationType;
}) {
  try {
    await addDoc(collection(db, 'notifications'), {
      ...params,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}
