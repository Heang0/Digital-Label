const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

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

async function checkLabel() {
  const labelId = 'lq7rA7GC3V3MrrNx0JjM';
  const docRef = doc(db, 'labels', labelId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) {
    console.log('Label not found in Firestore.');
  } else {
    console.log('Label Data:', JSON.stringify(snap.data(), null, 2));
  }
}

checkLabel().catch(console.error);
