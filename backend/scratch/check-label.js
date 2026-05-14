const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkLabel() {
  const labelId = 'lq7rA7GC3V3MrrNx0JjM';
  const doc = await db.collection('labels').doc(labelId).get();
  
  if (!doc.exists) {
    console.log('Label not found in Firestore.');
  } else {
    console.log('Label Data:', JSON.stringify(doc.data(), null, 2));
  }
}

checkLabel();
