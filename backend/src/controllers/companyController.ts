import { Request, Response } from 'express';
import { getFirestore } from 'firebase-admin/firestore';
import { createNotification } from '../utils/notifications';

export const createCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, code, address, phone, subscription, status } = req.body;

    const db = getFirestore();
    const companyRef = db.collection('companies').doc();
    
    await companyRef.set({
      id: companyRef.id,
      name,
      email,
      code: code || '',
      address: address || '',
      phone: phone || '',
      subscription: subscription || 'basic',
      status: status || 'active',
      branchesCount: 0,
      labelsCount: 0,
      staffCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Trigger Dynamic Notification
    await createNotification({
      title: 'Company Onboarded',
      message: `${name} has joined the platform as a ${subscription} partner.`,
      type: 'info'
    });

    res.status(201).json({ message: 'Company created successfully', companyId: companyRef.id });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCompany = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const db = getFirestore();
    await db.collection('companies').doc(id).update({
      ...updates,
      updatedAt: new Date(),
    });

    res.status(200).json({ message: 'Company updated successfully' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
