import { db } from "@/lib/firebase";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";

type ApplyDiscountArgs = {
  /** Firestore document id (labels/{labelId}) */
  labelId: string;
  /** Current base price (usually from branch_products currentPrice) */
  basePrice: number;
  /** 1..100 */
  percent: number;
  /** Optional: discount expires after N minutes (if omitted -> no expiry) */
  durationMinutes?: number;
};

type ClearDiscountArgs = {
  labelId: string;
  basePrice: number;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Apply a percent discount to a single label document.
 * Updates fields used by your DigitalLabelCard/DigitalLabelGrid:
 * - basePrice, currentPrice, finalPrice
 * - discountPercent, discountPrice, discountEndAt
 * - lastSync, status
 */
export async function applyDiscountToLabel(args: ApplyDiscountArgs) {
  const { labelId, basePrice, percent, durationMinutes } = args;

  if (!labelId) throw new Error("Missing labelId");
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new Error("Invalid basePrice");
  if (!Number.isFinite(percent) || percent <= 0 || percent > 100) throw new Error("Invalid percent");

  const labelRef = doc(db, "labels", labelId);

  // optional safety check
  const snap = await getDoc(labelRef);
  if (!snap.exists()) throw new Error("Label not found");

  const discountPrice = round2(basePrice * (1 - percent / 100));
  const discountEndAt =
    typeof durationMinutes === "number" && durationMinutes > 0
      ? Timestamp.fromDate(new Date(Date.now() + durationMinutes * 60 * 1000))
      : null;

  await updateDoc(labelRef, {
    basePrice,
    currentPrice: basePrice,
    finalPrice: discountPrice,

    discountPercent: percent,
    discountPrice,
    discountEndAt,

    lastSync: Timestamp.now(),
    status: "syncing",
  });
}

/**
 * Clear discount and restore finalPrice to basePrice.
 */
export async function clearDiscountFromLabel(args: ClearDiscountArgs) {
  const { labelId, basePrice } = args;

  if (!labelId) throw new Error("Missing labelId");
  if (!Number.isFinite(basePrice) || basePrice <= 0) throw new Error("Invalid basePrice");

  const labelRef = doc(db, "labels", labelId);

  const snap = await getDoc(labelRef);
  if (!snap.exists()) throw new Error("Label not found");

  await updateDoc(labelRef, {
    basePrice,
    currentPrice: basePrice,
    finalPrice: basePrice,

    discountPercent: null,
    discountPrice: null,
    discountEndAt: null,

    lastSync: Timestamp.now(),
    status: "syncing",
  });
}
