"use client";

import { Timestamp } from "firebase/firestore";
import { Battery, Tag, Clock, Percent } from "lucide-react";

type Props = {
  label: {
    labelId?: string;
    labelCode: string;
    aisle: string;
    shelf: string;
    productId?: string | null;
    productName?: string;
    productSku?: string | null;
    basePrice?: number | null;
    finalPrice?: number | null;
    discountPercent?: number | null;
    discountPrice?: number | null;
    discountEndAt?: Timestamp | null;
    battery?: number;
    lastSync?: Timestamp | null;
    category?: string;
    unit?: string; // e.g., "per kg", "each", "pack"
  };
};

export default function DigitalLabelCard({ label }: Props) {
  const now = Date.now();
  const endMs = label.discountEndAt?.toDate?.().getTime?.() ?? null;
  const discountActive = label.discountPercent != null && label.discountPrice != null;
  const isExpiredDiscount = discountActive && endMs && now > endMs;
  
  const displayPrice = isExpiredDiscount 
    ? (label.basePrice ?? null)
    : discountActive
    ? (label.discountPrice ?? label.finalPrice ?? null)
    : (label.finalPrice ?? label.basePrice ?? null);
    
  const labelId = label.labelId ?? label.labelCode;

  // Format time remaining for discount
  const getTimeRemaining = () => {
    if (!endMs || !discountActive) return null;
    const remainingMs = endMs - now;
    if (remainingMs <= 0) return "Expired";
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} minutes`;
  };

  return (
    <div className={`rounded-xl border-2 p-4 shadow-lg transition-all duration-300 hover:shadow-xl ${
      discountActive && !isExpiredDiscount 
        ? 'border-red-500 bg-gradient-to-br from-red-50 to-white' 
        : 'border-gray-300 bg-gradient-to-br from-white to-gray-50'
    }`}>
      {/* Header with label ID and battery */}
      <div className="flex items-center justify-between mb-3 border-b pb-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-gray-500" />
          <span className="font-mono text-sm font-bold text-gray-700">
            #{labelId.slice(0, 8).toUpperCase()}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {label.battery != null && (
            <div className="flex items-center gap-1">
              <Battery className={`h-4 w-4 ${
                label.battery > 60 ? 'text-green-500' :
                label.battery > 20 ? 'text-yellow-500' : 'text-red-500'
              }`} />
              <span className="text-xs font-medium">{label.battery}%</span>
            </div>
          )}
          
          {label.lastSync && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{label.lastSync.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          )}
        </div>
      </div>

      {/* Product Information */}
      <div className="mb-4">
        <div className="mb-1">
          {label.category && (
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              {label.category}
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
          {label.productName || "UNASSIGNED PRODUCT"}
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                SKU: {label.productSku || "N/A"}
              </span>
              <span className="text-xs text-gray-500">
                {label.aisle} • {label.shelf}
              </span>
            </div>
          </div>
          
          {label.unit && (
            <span className="text-xs text-gray-500 font-medium">
              {label.unit}
            </span>
          )}
        </div>
      </div>

      {/* Price Display - MAIN FOCUS */}
      <div className="mb-4">
        {discountActive && !isExpiredDiscount ? (
          <div className="space-y-2">
            {/* Original Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Regular Price:</span>
              <span className="text-lg font-semibold text-gray-400 line-through">
                ${label.basePrice?.toFixed(2)}
              </span>
            </div>
            
            {/* Discounted Price */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-red-600">SALE PRICE:</span>
              <div className="text-right">
                <div className="text-4xl font-extrabold text-red-600 leading-none">
                  ${displayPrice?.toFixed(2)}
                </div>
                <div className="text-sm font-bold text-red-600">
                  Save {label.discountPercent}%
                </div>
              </div>
            </div>
            
            {/* Time Remaining */}
            {getTimeRemaining() && (
              <div className="mt-2 flex items-center justify-between bg-red-100 px-3 py-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-red-600" />
                  <span className="text-xs font-bold text-red-700">ENDS IN:</span>
                </div>
                <span className="text-sm font-bold text-red-700">
                  {getTimeRemaining()}
                </span>
              </div>
            )}
          </div>
        ) : (
          // Regular Price Display
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">PRICE:</span>
            <div className="text-right">
              <div className="text-4xl font-extrabold text-gray-900 leading-none">
                ${displayPrice?.toFixed(2) || "0.00"}
              </div>
              {label.unit && (
                <div className="text-xs text-gray-500">per {label.unit}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {discountActive && !isExpiredDiscount && (
              <div className="flex items-center gap-1 bg-red-600 text-white px-3 py-1 rounded-full">
                <Percent className="h-3 w-3" />
                <span className="text-xs font-bold">ON SALE</span>
              </div>
            )}
            
            {isExpiredDiscount && (
              <div className="flex items-center gap-1 bg-gray-600 text-white px-3 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-bold">SALE ENDED</span>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500">
            Updated: {label.lastSync ? 
              label.lastSync.toDate().toLocaleDateString() : 
              "Never"}
          </div>
        </div>
      </div>
    </div>
  );
}