import { getFirestore, FieldValue } from 'firebase-admin/firestore';

export interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
}

export const createNotification = async (data: NotificationData) => {
  try {
    const db = getFirestore();
    await db.collection('notifications').add({
      ...data,
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};
