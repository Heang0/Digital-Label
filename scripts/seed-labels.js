const admin = require("firebase-admin");
const path = require("path");

const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  const labels = [
    { labelCode: "DL-001", aisle: "Dairy", shelf: "Shelf 1", productId: null, activePrice: 2.5 },
    { labelCode: "DL-002", aisle: "Dairy", shelf: "Shelf 2", productId: null, activePrice: 1.8 },
    { labelCode: "DL-003", aisle: "Dairy", shelf: "Shelf 3", productId: null, activePrice: 4.2 },
    { labelCode: "DL-004", aisle: "Beverages", shelf: "Shelf 1", productId: null, activePrice: 3.5 },
    { labelCode: "DL-005", aisle: "Beverages", shelf: "Shelf 2", productId: null, activePrice: 2.1 },
  ];

  const batch = db.batch();
  labels.forEach((l) => {
    const ref = db.collection("labels").doc(); // auto-id
    batch.set(ref, {
      ...l,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
  console.log("✅ Seeded labels:", labels.length);
  process.exit(0);
}

seed().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
