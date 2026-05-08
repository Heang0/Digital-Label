// Run this script to initialize Firebase collections
// node scripts/init-firebase.js

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc } from 'firebase/firestore';

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

async function initializeCollections() {
  console.log('Initializing Firebase collections...');

  // Create a sample company
  const companyData = {
    name: "Kitty Corporation",
    email: "contact@kittycorp.com",
    phone: "+1 (555) 123-4567",
    address: "123 Business Street, New York, NY 10001",
    subscription: "pro",
    status: "active",
    ownerId: "vendor_user_id", // You'll need to replace this
    createdAt: new Date(),
  };

  // Create sample branches
  const branches = [
    {
      name: "Downtown Store",
      address: "456 Downtown Ave, New York, NY 10002",
      phone: "+1 (555) 234-5678",
      manager: "John Smith",
      companyId: "company_1",
      status: "active",
      createdAt: new Date(),
    },
    {
      name: "Uptown Store",
      address: "789 Uptown Blvd, New York, NY 10003",
      phone: "+1 (555) 345-6789",
      manager: "Sarah Johnson",
      companyId: "company_1",
      status: "active",
      createdAt: new Date(),
    },
  ];

  // Create sample products
  const products = [
    {
      name: "Premium Coffee Beans",
      description: "Fresh roasted coffee beans, 500g",
      sku: "COF-001",
      category: "Beverages",
      basePrice: 12.99,
      companyId: "company_1",
      createdBy: "vendor_user_id",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "Organic Milk",
      description: "Fresh organic milk, 1L",
      sku: "DAI-001",
      category: "Dairy",
      basePrice: 3.99,
      companyId: "company_1",
      createdBy: "vendor_user_id",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  try {
    // Create company
    const companyRef = doc(db, 'companies', 'company_1');
    await setDoc(companyRef, companyData);
    console.log('✓ Created company');

    // Create branches
    for (const branch of branches) {
      const branchRef = await addDoc(collection(db, 'branches'), branch);
      console.log(`✓ Created branch: ${branch.name} (${branchRef.id})`);
      
      // Update branch with its ID
      await setDoc(branchRef, { ...branch, id: branchRef.id }, { merge: true });
    }

    // Create products
    for (const product of products) {
      const productRef = await addDoc(collection(db, 'products'), product);
      console.log(`✓ Created product: ${product.name} (${productRef.id})`);
      
      // Update product with its ID
      await setDoc(productRef, { ...product, id: productRef.id }, { merge: true });

      // Create branch products for each branch
      const branchProducts = [
        {
          productId: productRef.id,
          branchId: "branch_1", // Replace with actual branch IDs
          companyId: "company_1",
          currentPrice: product.basePrice,
          stock: 50,
          minStock: 10,
          status: "in-stock",
          lastUpdated: new Date(),
        },
        {
          productId: productRef.id,
          branchId: "branch_2", // Replace with actual branch IDs
          companyId: "company_1",
          currentPrice: product.basePrice,
          stock: 30,
          minStock: 10,
          status: "in-stock",
          lastUpdated: new Date(),
        },
      ];

      for (const bp of branchProducts) {
        await addDoc(collection(db, 'branch_products'), bp);
      }
    }

    console.log('\n✅ Initialization complete!');
    console.log('Company ID: company_1');
    console.log('You can now use these IDs in your user data.');

  } catch (error) {
    console.error('Error initializing collections:', error);
  }
}

initializeCollections();
