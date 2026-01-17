"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type NotifyVariant = "success" | "error" | "info" | "warning";

export type NotifyPayload = {
  title: string;
  message?: string;
  variant?: NotifyVariant;
  /** Auto close after ms. Set 0 to require manual close. Default: 1800 */
  timeoutMs?: number;
};

type NotifyApi = {
  notify: (payload: NotifyPayload) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
};

const Ctx = createContext<NotifyApi | null>(null);

function variantStyles(variant: NotifyVariant) {
  switch (variant) {
    case "success":
      return { ring: "ring-emerald-200", dot: "bg-emerald-500" };
    case "error":
      return { ring: "ring-red-200", dot: "bg-red-500" };
    case "warning":
      return { ring: "ring-amber-200", dot: "bg-amber-500" };
    default:
      return { ring: "ring-blue-200", dot: "bg-blue-500" };
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<NotifyPayload | null>(null);

  // Prevent duplicate popups (e.g. double submit / React dev strict-mode)
  const lastKeyRef = useRef<string>("");
  const lastAtRef = useRef<number>(0);

  const close = useCallback(() => {
    setOpen(false);
    // keep payload for exit animation; clear a bit later
    setTimeout(() => setPayload(null), 180);
  }, []);

  const notify = useCallback(
    (p: NotifyPayload) => {
      const variant = p.variant ?? "info";
      const key = `${variant}::${p.title}::${p.message ?? ""}`;
      const now = Date.now();

      // Ignore the same notification fired twice within 500ms
      if (key === lastKeyRef.current && now - lastAtRef.current < 500) return;

      lastKeyRef.current = key;
      lastAtRef.current = now;

      setPayload({ ...p, variant, timeoutMs: p.timeoutMs ?? 1800 });
      setOpen(true);
    },
    []
  );

  const api = useMemo<NotifyApi>(
    () => ({
      notify,
      success: (title, message) => notify({ title, message, variant: "success" }),
      error: (title, message) => notify({ title, message, variant: "error", timeoutMs: 0 }),
      info: (title, message) => notify({ title, message, variant: "info" }),
      warning: (title, message) => notify({ title, message, variant: "warning" }),
    }),
    [notify]
  );

  useEffect(() => {
    if (!open || !payload) return;
    const ms = payload.timeoutMs ?? 1800;
    if (ms <= 0) return;
    const t = window.setTimeout(() => close(), ms);
    return () => window.clearTimeout(t);
  }, [open, payload, close]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const styles = variantStyles(payload?.variant ?? "info");

  return (
    <Ctx.Provider value={api}>
      {children}

      {/* Modal */}
      {payload && (
        <div
          className={
            "fixed inset-0 z-[100] flex items-center justify-center p-4 " +
            (open ? "pointer-events-auto" : "pointer-events-none")
          }
          aria-hidden={!open}
        >
          <div
            className={
              "absolute inset-0 bg-black/40 transition-opacity " +
              (open ? "opacity-100" : "opacity-0")
            }
            onClick={close}
          />

          <div
            role="dialog"
            aria-modal="true"
            className={
              "relative w-full max-w-md rounded-2xl bg-white shadow-xl ring-4 " +
              styles.ring +
              " transition-all " +
              (open ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2")
            }
          >
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className={`mt-1 h-3 w-3 rounded-full ${styles.dot}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-base font-semibold text-gray-900">{payload.title}</div>
                  {payload.message ? (
                    <div className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{payload.message}</div>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="h-9 rounded-xl border bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}

export function useNotify() {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useNotify must be used within <NotificationProvider />");
  }
  return v;
}
