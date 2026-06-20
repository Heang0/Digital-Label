import { db } from './firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';

export interface LabelUIConfig {
  template: 'standard' | 'promo' | 'minimal' | 'inventory';
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  refreshInterval: number;
  showBattery: boolean;
  showLocation: boolean;
  showStock: boolean;
  showQrCode: boolean;
  highContrast: boolean;
}

export const DEFAULT_LABEL_CONFIG: LabelUIConfig = {
  template: 'standard',
  primaryColor: '#000000',
  accentColor: '#FB5050',
  fontFamily: 'Inter',
  refreshInterval: 15,
  showBattery: true,
  showLocation: true,
  showStock: true,
  showQrCode: true,
  highContrast: true,
};

export const getLabelConfig = async (companyId: string | number): Promise<LabelUIConfig> => {
  if (!companyId) return DEFAULT_LABEL_CONFIG;
  try {
    const d = await getDoc(doc(db, 'companies', companyId.toString(), 'config', 'label_design'));
    if (d.exists()) return d.data() as LabelUIConfig;
    
    // Fallback to global if company-specific doesn't exist
    const gd = await getDoc(doc(db, 'system_config', 'label_design'));
    if (gd.exists()) return gd.data() as LabelUIConfig;
    
    return DEFAULT_LABEL_CONFIG;
  } catch (error) {
    console.error('Error fetching label config:', error);
    return DEFAULT_LABEL_CONFIG;
  }
};

export const saveLabelConfig = async (companyId: string | number, config: Partial<LabelUIConfig>) => {
  if (!companyId) throw new Error('Company ID is required to save label config');
  return setDoc(doc(db, 'companies', companyId.toString(), 'config', 'label_design'), {
    ...config,
    updatedAt: Timestamp.now()
  }, { merge: true });
};
