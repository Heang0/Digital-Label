import {
  collection,
  doc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function ensureDefaultBranch(companyId: string) {
  const q = query(collection(db, "branches"), where("companyId", "==", companyId), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    return { branchId: snap.docs[0].id, ...snap.docs[0].data() };
  }

  const ref = doc(collection(db, "branches"));
  await setDoc(ref, {
    companyId,
    name: "Main Branch",
    createdAt: serverTimestamp(),
  });

  return { branchId: ref.id, companyId, name: "Main Branch" };
}

export async function generateLabelsForBranch(params: {
  companyId: string;
  branchId: string;
}) {
  const { companyId, branchId } = params;

  // prevent duplicate generation
  const existing = await getDocs(
    query(
      collection(db, "labels"),
      where("companyId", "==", companyId),
      where("branchId", "==", branchId),
      limit(1)
    )
  );
  if (!existing.empty) return { created: 0, skipped: true };

  const layout = [
    { aisle: "Dairy", shelves: ["Shelf 1", "Shelf 2", "Shelf 3"] },
    { aisle: "Beverages", shelves: ["Shelf 1", "Shelf 2"] },
  ];

  const batch = writeBatch(db);
  let counter = 1;
  let created = 0;

  for (const a of layout) {
    for (const shelf of a.shelves) {
      const labelCode = `DL-${String(counter).padStart(3, "0")}`;
      counter++;

      const ref = doc(collection(db, "labels"));
      batch.set(ref, {
        companyId,
        branchId,
        labelId: labelCode,
        labelCode,
        aisle: a.aisle,
        shelf,

        productId: null,
        productName: null,
        productSku: null,

        basePrice: null,
        currentPrice: null,

        discountPercent: null,
        discountPrice: null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      created++;
    }
  }

  await batch.commit();
  return { created, skipped: false };
}
