"use client";

import { Timestamp } from "firebase/firestore";

type Props = {
  label: {
    labelCode: string;
    aisle: string;
    shelf: string;

    basePrice?: number | null;
    finalPrice?: number | null;

    discountPercent?: number | null;
    discountPrice?: number | null;
    discountEndAt?: Timestamp | null;
  };
};

export default function DigitalLabelCard({ label }: Props) {
  const now = Date.now();
  const endMs = label.discountEndAt?.toDate?.().getTime?.() ?? null;

  const discountActive =
    label.discountPrice != null &&
    (endMs == null || now < endMs);

  const base = label.basePrice ?? null;

  const display = discountActive
    ? (label.discountPrice ?? label.finalPrice ?? null)
    : (label.finalPrice ?? base);

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{label.labelCode}</div>
        <div className="text-xs text-gray-500">
          {label.aisle} • {label.shelf}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between">
        <div>
          {discountActive && base != null ? (
            <>
              <div className="text-xs text-gray-500 line-through">${base}</div>
              <div className="text-3xl font-bold">
                {display != null ? `$${display}` : "--"}
              </div>
            </>
          ) : (
            <div className="text-3xl font-bold">
              {display != null ? `$${display}` : "--"}
            </div>
          )}
        </div>

        {discountActive && (
          <div className="rounded-md bg-black px-2 py-1 text-xs font-semibold text-white">
            DISCOUNT{label.discountPercent != null ? ` ${label.discountPercent}%` : ""}
          </div>
        )}
      </div>
    </div>
  );
}
