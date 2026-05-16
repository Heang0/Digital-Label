'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem, money } from './types';

interface CheckoutFlowModalProps {
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  isSavingSale: boolean;
  cart: CartItem[];
  totals: { subtotal: number; discount: number; total: number };
  cashReceived: string;
  setCashReceived: (val: string) => void;
  saleError: string | null;
  confirmCheckout: () => void;
  savedSaleId: string | null;
  savedReceiptNo: string | null;
  receiptPreviewText: string;
  printReceipt: (text: string) => void;
  downloadReceipt: (text: string, receiptNo?: string | null) => void;
  clearCart: () => void;
  setProductIdInput: (val: string) => void;
}

export function CheckoutFlowModal({
  isCheckoutOpen,
  setIsCheckoutOpen,
  isSavingSale,
  cart,
  totals,
  cashReceived,
  setCashReceived,
  saleError,
  confirmCheckout,
  savedSaleId,
  savedReceiptNo,
  receiptPreviewText,
  printReceipt,
  downloadReceipt,
  clearCart,
  setProductIdInput,
}: CheckoutFlowModalProps) {
  if (!isCheckoutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto pt-10 sm:pt-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border-0 overflow-hidden my-auto">
        <div className="px-6 py-5 border-b bg-gray-50/50 flex items-center justify-between">
          <div className="pr-4">
            <div className="text-xl font-black text-gray-900">បញ្ជាក់ការបង់ប្រាក់ (Checkout)</div>
            <div className="text-sm text-gray-600">This will create a real sale record for vendor/staff history.</div>
          </div>
          <Button variant="outline" onClick={() => setIsCheckoutOpen(false)} disabled={isSavingSale}>
            Close
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          <div className="p-6">
            <label className="text-sm font-semibold text-gray-700">Cash received</label>
            <Input
              className="mt-2"
              value={cashReceived}
              onChange={(e) => setCashReceived(e.target.value)}
              placeholder="e.g. 20.00"
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">{money(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium text-emerald-700">-{money(totals.discount)}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="font-semibold">Total</span>
                <span className="font-bold">{money(totals.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Change</span>
                <span className="font-medium">{money(Math.max(0, Number(cashReceived || 0) - totals.total))}</span>
              </div>
            </div>

            {saleError && <div className="mt-3 text-sm text-red-600">{saleError}</div>}

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Button
                onClick={confirmCheckout}
                disabled={isSavingSale || cart.length === 0 || Boolean(savedSaleId)}
                className="w-full"
              >
                {savedSaleId ? 'Saved' : isSavingSale ? 'Saving…' : 'Confirm & Save'}
              </Button>

              <Button
                variant="outline"
                onClick={() => setIsCheckoutOpen(false)}
                disabled={isSavingSale}
                className="w-full"
              >
                Close
              </Button>

              {savedSaleId && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => printReceipt(receiptPreviewText)}
                    className="w-full"
                  >
                    Print Receipt
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadReceipt(receiptPreviewText, savedReceiptNo)}
                    className="w-full"
                  >
                    Download Receipt
                  </Button>
                </>
              )}

              {savedSaleId && (
                <Button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    clearCart();
                    setProductIdInput('');
                  }}
                  className="w-full sm:col-span-2"
                >
                  Finish (New Sale)
                </Button>
              )}
            </div>
          </div>

          <div className="p-6 bg-slate-50 border-t lg:border-t-0 lg:border-l">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">ប័ណ្ណទូទាត់ (Receipt Preview)</div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 font-mono text-xs leading-5 whitespace-pre-wrap overflow-auto max-h-[40vh] lg:max-h-[500px] text-gray-900 shadow-inner">
              {receiptPreviewText}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {savedSaleId
                ? `Saved as ${savedReceiptNo}. You can print or download the receipt.`
                : 'Receipt preview (paper style).'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
