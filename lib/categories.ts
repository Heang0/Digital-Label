import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';

export interface Category {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  color?: string; // For UI display
  icon?: string;
  createdAt: Date;
}

function stripUndefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
}

// Get all categories for a vendor
export async function getVendorCategories(companyId: string): Promise<Category[]> {
  if (!companyId) return [];
  
  const q = query(
    collection(db, 'categories'),
    where('companyId', '==', companyId)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Category));
}

// Create a new category
export async function createCategory(companyId: string, categoryData: Omit<Category, 'id' | 'companyId' | 'createdAt'>) {
  const payload = stripUndefined({
    ...categoryData,
    companyId,
    createdAt: new Date(),
  });
  const docRef = await addDoc(collection(db, 'categories'), payload);
  
  return docRef.id;
}

// Delete a category
export async function deleteCategory(categoryId: string) {
  await deleteDoc(doc(db, 'categories', categoryId));
}

// Update a category
export async function updateCategory(categoryId: string, updates: Partial<Category>) {
  const { id: _id, ...rest } = updates;
  const payload = stripUndefined(rest);
  await updateDoc(doc(db, 'categories', categoryId), payload);
}
