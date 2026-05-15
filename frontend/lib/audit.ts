import { 
  collection, 
  addDoc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog } from '@/types';

export const logAction = async (
  userId: string, 
  userName: string, 
  action: string, 
  details: string,
  targetId?: string,
  targetType?: 'user' | 'company' | 'label' | 'product' | 'system'
) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      userId,
      userName,
      action,
      details,
      targetId: targetId || null,
      targetType: targetType || 'system',
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Failed to log action:', error);
  }
};
