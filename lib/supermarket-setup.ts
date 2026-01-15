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
  count?: number;
}) {
  const { companyId, branchId, count = 6 } = params;

  const layout = [
    { aisle: "Dairy", shelves: ["Shelf 1", "Shelf 2", "Shelf 3"] },
    { aisle: "Beverages", shelves: ["Shelf 1", "Shelf 2"] },
  ];

  const batch = writeBatch(db);
  const existing = await getDocs(
    query(
      collection(db, "labels"),
      where("companyId", "==", companyId),
      where("branchId", "==", branchId)
    )
  );
  let counter = existing.size + 1;
  let created = 0;

  for (let i = 0; i < count; i++) {
    const layoutIndex = i % layout.length;
    const aisle = layout[layoutIndex].aisle;
    const shelf =
      layout[layoutIndex].shelves[i % layout[layoutIndex].shelves.length];

    const labelCode = `DL-${String(counter).padStart(3, "0")}`;
    counter++;

    const ref = doc(collection(db, "labels"));
    batch.set(ref, {
      companyId,
      branchId,
      labelId: labelCode,
      labelCode,
      aisle,
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

  await batch.commit();
  return { created, skipped: false };
}
