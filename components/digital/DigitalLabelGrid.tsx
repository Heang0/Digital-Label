"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import DigitalLabelCard from "./DigitalLabelCard";

type LabelDoc = {
  id: string;
  labelCode: string;
  aisle: string;
  shelf: string;
  branchId?: string;
  companyId?: string;
  productId: string | null;
  productName?: string;
  activePrice: number | null;
};

export default function DigitalLabelGrid() {
  const params = useSearchParams();
  const companyId = params.get("companyId");
  const branchId = params.get("branchId");

  const [labels, setLabels] = useState<LabelDoc[]>([]);

  useEffect(() => {
    // If you want it to work only when companyId exists:
    if (!companyId) return;

    const base = collection(db, "labels");

    const q = branchId
      ? query(base,
          where("companyId", "==", companyId),
          where("branchId", "==", branchId),
          orderBy("labelCode", "asc")
        )
      : query(base,
          where("companyId", "==", companyId),
          orderBy("labelCode", "asc")
        );

    const unsub = onSnapshot(q, (snap) => {
      setLabels(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as any),
        }))
      );
    });

    return () => unsub();
  }, [companyId, branchId]);

  if (!companyId) {
    return (
      <div className="text-sm text-gray-600">
        Missing companyId. Example: <code>/digital-labels?companyId=YOUR_COMPANY_ID</code>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {labels.map((l) => (
        <DigitalLabelCard key={l.id} label={l} />
      ))}
    </div>
  );
}
