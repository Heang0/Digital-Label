// scripts/setup-firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCfgE3QkbaBoMZCBmU_twXH2lQu192bJH0",
  authDomain: "digital-label-8620b.firebaseapp.com",
  projectId: "digital-label-8620b",
  storageBucket: "digital-label-8620b.firebasestorage.app",
  messagingSenderId: "342078286952",
  appId: "1:342078286952:web:c125a1ae12edac51029fdd",
  measurementId: "G-QHGBZ7RD29"
};

// Demo users
const demoUsers = [
  {
    email: 'demo@digital-label.com',
    password: 'demopassword123',
    name: 'Demo User',
    role: 'vendor'
  },
  {
    email: 'admin@digital-label.com',
    password: 'adminpassword123',
    name: 'Admin User',
    role: 'admin'
  },
  {
    email: 'vendor@company.com',
    password: 'vendorpassword123',
    name: 'Vendor User',
    role: 'vendor'
  },
  {
    email: 'staff@store.com',
    password: 'staffpassword123',
    name: 'Staff User',
    role: 'staff'
  }
];

async function setupFirebase() {
  console.log('🚀 Setting up Firebase demo users...\n');
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  for (const demoUser of demoUsers) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        demoUser.email,
        demoUser.password
      );

      const userId = userCredential.user.uid;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userId), {
        id: userId,
        email: demoUser.email,
        name: demoUser.name,
        role: demoUser.role,
        createdAt: new Date().toISOString(),
        isDemo: demoUser.email === 'demo@digital-label.com'
      });

      console.log(`✅ Created: ${demoUser.email}`);
      console.log(`   Role: ${demoUser.role}`);
      console.log(`   Password: ${demoUser.password}\n`);
      
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ Already exists: ${demoUser.email}\n`);
      } else {
        console.error(`❌ Error creating ${demoUser.email}:`, error.message, '\n');
      }
    }
  }

  console.log('🎉 Firebase setup complete!');
  console.log('\n📋 Demo Accounts:');
  console.log('================');
  demoUsers.forEach(user => {
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Role: ${user.role}`);
    console.log('---');
  });
  
  console.log('\n🔗 Now go to: http://localhost:3000');
  console.log('🔑 Use demo@digital-label.com / demopassword123 to login');
}

// Run setup
setupFirebase().catch(console.error);