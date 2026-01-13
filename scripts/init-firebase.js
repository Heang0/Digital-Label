// scripts/init-firebase.js
const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

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

// Demo users - NO ADMIN in demo
const demoUsers = [
  {
    email: 'demo@digital-label.com',
    password: 'demopassword123',
    name: 'Demo Retail Chain',
    role: 'vendor'
  },
  {
    email: 'staff.demo@store.com',
    password: 'staffdemo123',
    name: 'Demo Staff',
    role: 'staff'
  }
];

// Admin user (not for demo, separate)
const adminUser = {
  email: 'admin@digital-label.com',
  password: 'adminpassword123',
  name: 'System Admin',
  role: 'admin'
};

async function setupFirebase() {
  console.log('🚀 Setting up Firebase for Digital Label...\n');
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // Create Admin User
  console.log('👑 Creating Admin Account...');
  try {
    const adminCredential = await createUserWithEmailAndPassword(
      auth,
      adminUser.email,
      adminUser.password
    );

    await setDoc(doc(db, 'users', adminCredential.user.uid), {
      id: adminCredential.user.uid,
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role,
      createdAt: new Date().toISOString(),
      isAdmin: true
    });

    console.log(`✅ Admin created: ${adminUser.email}`);
    console.log(`   Password: ${adminUser.password}\n`);
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️ Admin already exists: ${adminUser.email}\n`);
    } else {
      console.error(`❌ Error creating admin:`, error.message, '\n');
    }
  }

  // Create Demo Users and Data
  for (const demoUser of demoUsers) {
    console.log(`🎪 Creating ${demoUser.role} demo account...`);
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        demoUser.email,
        demoUser.password
      );

      const userId = userCredential.user.uid;

      if (demoUser.role === 'vendor') {
        // Create demo company for vendor
        const companyId = `company_demo_${Date.now()}`;
        
        // 1. Create user document
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          companyId: companyId,
          createdAt: new Date().toISOString(),
          isDemo: true
        });

        // 2. Create company document
        await setDoc(doc(db, 'companies', companyId), {
          id: companyId,
          name: 'Demo Retail Chain',
          email: demoUser.email,
          phone: '+1 (555) 123-4567',
          address: '123 Demo Street, Business City',
          subscription: 'pro',
          status: 'active',
          ownerId: userId,
          isDemo: true,
          createdAt: new Date().toISOString(),
        });

        // 3. Create demo branches
        const branches = [
          {
            id: `branch_${Date.now()}_1`,
            companyId: companyId,
            name: 'Downtown Store',
            address: '456 Main St, Business City',
            phone: '+1 (555) 234-5678',
            status: 'active',
            createdAt: new Date().toISOString(),
          },
          {
            id: `branch_${Date.now()}_2`,
            companyId: companyId,
            name: 'Uptown Store',
            address: '789 Park Ave, Business City',
            phone: '+1 (555) 345-6789',
            status: 'active',
            createdAt: new Date().toISOString(),
          }
        ];

        for (const branch of branches) {
          await setDoc(doc(db, 'branches', branch.id), branch);
        }

        // 4. Create demo products
        const products = [
          {
            id: `prod_${Date.now()}_1`,
            companyId: companyId,
            name: 'Premium Coffee Beans',
            sku: 'COF-001',
            category: 'Beverages',
            description: 'Arabica coffee beans, 500g pack',
            basePrice: 12.99,
            createdAt: new Date().toISOString(),
          },
          {
            id: `prod_${Date.now()}_2`,
            companyId: companyId,
            name: 'Organic Milk',
            sku: 'DAI-001',
            category: 'Dairy',
            description: 'Fresh organic milk, 1 liter',
            basePrice: 3.99,
            createdAt: new Date().toISOString(),
          },
          {
            id: `prod_${Date.now()}_3`,
            companyId: companyId,
            name: 'Whole Wheat Bread',
            sku: 'BAK-001',
            category: 'Bakery',
            description: 'Fresh baked bread, 500g',
            basePrice: 2.49,
            createdAt: new Date().toISOString(),
          }
        ];

        for (const product of products) {
          await setDoc(doc(db, 'products', product.id), product);
        }

        // 5. Create demo labels
        const labels = [
          {
            id: `label_${Date.now()}_1`,
            branchId: branches[0].id,
            productId: products[0].id,
            labelId: 'DL-001',
            location: 'Aisle 3, Shelf B',
            battery: 85,
            status: 'active',
            lastSync: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          },
          {
            id: `label_${Date.now()}_2`,
            branchId: branches[0].id,
            productId: products[1].id,
            labelId: 'DL-002',
            location: 'Aisle 5, Shelf A',
            battery: 45,
            status: 'low-battery',
            lastSync: new Date().toISOString(),
            createdAt: new Date().toISOString(),
          }
        ];

        for (const label of labels) {
          await setDoc(doc(db, 'labels', label.id), label);
        }

        console.log(`✅ Demo vendor created: ${demoUser.email}`);
        console.log(`   Company: Demo Retail Chain`);
        console.log(`   Branches: 2 stores`);
        console.log(`   Products: 3 items`);
        console.log(`   Labels: 2 digital labels\n`);

      } else if (demoUser.role === 'staff') {
        // Create staff user
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          branchId: `branch_${Date.now()}_1`, // Assign to first branch
          createdAt: new Date().toISOString(),
          isDemo: true,
          permissions: {
            canViewProducts: true,
            canUpdateStock: true,
            canReportIssues: true,
            canViewReports: false,
            canChangePrices: false
          }
        });

        console.log(`✅ Demo staff created: ${demoUser.email}`);
        console.log(`   Role: Store Staff`);
        console.log(`   Permissions: Stock management, issue reporting\n`);
      }
      
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`⚠️ Already exists: ${demoUser.email}\n`);
      } else {
        console.error(`❌ Error creating ${demoUser.email}:`, error.message, '\n');
      }
    }
  }

  console.log('🎉 Firebase setup complete!');
  console.log('\n📋 ACCOUNTS CREATED:');
  console.log('===================');
  console.log('\n👑 ADMIN (Full Control):');
  console.log(`Email: ${adminUser.email}`);
  console.log(`Password: ${adminUser.password}`);
  console.log(`Role: ${adminUser.role}`);
  
  console.log('\n🎪 DEMO ACCOUNTS (Testing Only):');
  demoUsers.forEach(user => {
    console.log(`\nEmail: ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Role: ${user.role}`);
    if (user.role === 'vendor') {
      console.log(`Company: Demo Retail Chain`);
      console.log(`Features: Full demo data with 2 branches, 3 products, 2 labels`);
    }
  });
  
  console.log('\n🔗 Website: http://localhost:3000');
  console.log('\n📝 INSTRUCTIONS:');
  console.log('1. Use admin account to manage the platform');
  console.log('2. Use demo vendor account to test features');
  console.log('3. Use demo staff account to test branch operations');
  console.log('\n💾 All data is stored in your Firebase project!');
}

// Run setup
setupFirebase().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});