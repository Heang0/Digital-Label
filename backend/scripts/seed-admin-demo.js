import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0",
  authDomain: "digital-label-8620b.firebaseapp.com",
  projectId: "digital-label-8620b",
  storageBucket: "digital-label-8620b.firebasestorage.app",
  messagingSenderId: "342078286952",
  appId: "1:342078286952:web:c125a1ae12edac51029fdd",
  measurementId: "G-QHGBZ7RD29"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedAdminDemo() {
  console.log('Seeding Admin Demo Data...');

  try {
    // 1. Audit Logs
    const auditLogs = [
      {
        userId: 'system',
        userName: 'System Bot',
        action: 'SYSTEM_STARTUP',
        details: 'All systems operational. Digital Label Engine v2.4 initialized.',
        timestamp: Timestamp.now(),
        targetType: 'system'
      },
      {
        userId: 'admin_1',
        userName: 'Super Admin',
        action: 'ONBOARD_VENDOR',
        details: 'Onboarded Global Retail Corp as a new enterprise vendor.',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 3600000)),
        targetType: 'user'
      },
      {
        userId: 'admin_1',
        userName: 'Super Admin',
        action: 'UPDATE_STATUS',
        details: 'Approved registration for Smart Mart (Branch #4).',
        timestamp: Timestamp.fromDate(new Date(Date.now() - 7200000)),
        targetType: 'company'
      }
    ];

    for (const log of auditLogs) {
      await addDoc(collection(db, 'audit_logs'), log);
      console.log(`✓ Logged: ${log.action}`);
    }

    // 2. Label Syncs
    const syncs = [
      {
        labelId: 'L_001',
        labelCode: 'ESL-7742-X',
        companyId: 'company_1',
        companyName: 'Kitty Corporation',
        status: 'success',
        retryCount: 0,
        lastAttempt: Timestamp.now()
      },
      {
        labelId: 'L_002',
        labelCode: 'ESL-8812-Y',
        companyId: 'company_1',
        companyName: 'Kitty Corporation',
        status: 'failed',
        error: 'Hardware Timeout: Label unreachable',
        retryCount: 2,
        lastAttempt: Timestamp.fromDate(new Date(Date.now() - 1800000))
      },
      {
        labelId: 'L_003',
        labelCode: 'ESL-9921-Z',
        companyId: 'company_1',
        companyName: 'Kitty Corporation',
        status: 'pending',
        retryCount: 0,
        lastAttempt: Timestamp.fromDate(new Date(Date.now() - 600000))
      }
    ];

    for (const sync of syncs) {
      await addDoc(collection(db, 'label_syncs'), sync);
      console.log(`✓ Sync Record: ${sync.labelCode}`);
    }

    // 3. Admin Notifications
    const notifications = [
      {
        companyId: 'admin',
        branchId: 'all',
        title: 'New Vendor Registration',
        message: 'Global Retail Corp has just registered. Review needed.',
        type: 'info',
        read: false,
        createdAt: Timestamp.now()
      },
      {
        companyId: 'admin',
        branchId: 'all',
        title: 'System Alert',
        message: 'Multiple label sync failures detected in Branch #2.',
        type: 'alert',
        read: false,
        createdAt: Timestamp.fromDate(new Date(Date.now() - 3600000))
      }
    ];

    for (const note of notifications) {
      await addDoc(collection(db, 'notifications'), note);
      console.log(`✓ Notification: ${note.title}`);
    }

    console.log('\n✅ Admin Demo Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedAdminDemo();
