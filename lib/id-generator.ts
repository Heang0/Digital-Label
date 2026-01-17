import { db } from "@/lib/firebase";
import { doc, runTransaction } from "firebase/firestore";

type CounterKey =
  | "nextProductNumber"
  | "nextLabelNumber"
  | "nextCategoryNumber"
  | "nextBranchNumber"
  | "nextSaleNumber";

type GlobalCounterKey = "nextCompanyNumber";

export async function nextCompanySequence(companyId: string, key: CounterKey) {
  const ref = doc(db, "companies", companyId, "counters", "main");

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const data = snap.exists()
      ? (snap.data() as any)
      : {
          nextProductNumber: 1,
          nextLabelNumber: 1,
          nextCategoryNumber: 1,
          nextBranchNumber: 1,
          nextSaleNumber: 1,
        };

    const current = Number(data[key] ?? 1);

    tx.set(ref, { ...data, [key]: current + 1 }, { merge: true });

    return current;
  });

  return result;
}

export async function nextBranchSequence(branchId: string, key: CounterKey) {
  const ref = doc(db, "branches", branchId, "counters", "main");

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const data = snap.exists()
      ? (snap.data() as any)
      : {
          nextProductNumber: 1,
          nextLabelNumber: 1,
          nextCategoryNumber: 1,
          nextBranchNumber: 1,
          nextSaleNumber: 1,
        };

    const current = Number(data[key] ?? 1);

    tx.set(ref, { ...data, [key]: current + 1 }, { merge: true });

    return current;
  });

  return result;
}

export async function nextGlobalSequence(key: GlobalCounterKey) {
  const ref = doc(db, "counters", "global");

  const result = await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);

    const data = snap.exists()
      ? (snap.data() as any)
      : {
          nextCompanyNumber: 1,
        };

    const current = Number(data[key] ?? 1);

    tx.set(ref, { ...data, [key]: current + 1 }, { merge: true });

    return current;
  });

  return result;
}

export function makeVendorCode(seq: number) {
  return `VE${String(seq).padStart(3, "0")}`;
}

export function makeProductCodeForVendor(vendorCode: string, seq: number) {
  const safePrefix = (vendorCode || "VE").toUpperCase().replace(/[^A-Z0-9]/g, "");
  return `PR-${safePrefix}-${String(seq).padStart(5, "0")}`;
}

export function makeSku(seq: number) {
  return `PR-${String(seq).padStart(5, "0")}`;
}

export function makeProductCode(categoryName: string, seq: number) {
  const prefix = (categoryName || "GEN").slice(0, 3).toUpperCase();
  return `PRD-${prefix}-${String(seq).padStart(4, "0")}`;
}

export function makeBranchCode(seq: number) {
  return `BR-${String(seq).padStart(4, "0")}`;
}
