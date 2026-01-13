import { doc, updateDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Apply a percent discount to a single label document.
 * This updates fields that your app already reads (currentPrice) + extra fields for the digital label UI.
 */
export async function applyDiscountToLabel(params: {
  labelId: string;   // Firestore document id (labels/{labelId})
  basePrice: number;
  percent: number;   // 1..100
  hours?: number;    // optional expiry
}) {
  const { labelId, basePrice, percent, hours } = params;

  const discountPrice = Number((basePrice * (1 - percent / 100)).toFixed(2));

  const discountEndAt =
    typeof hours === "number"
      ? Timestamp.fromDate(new Date(Date.now() + hours * 60 * 60 * 1000))
      : null;

  await updateDoc(doc(db, "labels", labelId), {
    basePrice,
    discountPercent: percent,
    discountPrice,
    discountEndAt,
    finalPrice: discountPrice,

    // keep your current UI working
    currentPrice: discountPrice,

    updatedAt: serverTimestamp(),
    lastSync: Timestamp.now(),
    status: "syncing",
  });
}

/** Clear discount and revert label back to base price. */
export async function clearDiscountFromLabel(params: {
  labelId: string;   // Firestore document id (labels/{labelId})
  basePrice: number;
}) {
  const { labelId, basePrice } = params;

  await updateDoc(doc(db, "labels", labelId), {
    basePrice,
    discountPercent: null,
    discountPrice: null,
    discountEndAt: null,
    finalPrice: basePrice,

    // keep your current UI working
    currentPrice: basePrice,

    updatedAt: serverTimestamp(),
    lastSync: Timestamp.now(),
    status: "syncing",
  });
}
