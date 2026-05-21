"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";
import { AlertCircle, CheckCircle, Info, X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface DialogOptions {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "default";
}

interface AlertOptions {
  title?: string;
  message: string;
  variant?: "error" | "info" | "success";
}

interface DialogState extends DialogOptions {
  id: string;
  resolve: (value: boolean) => void;
}

interface AlertState extends AlertOptions {
  id: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showErrorToast: (error: unknown) => void;
  /** Resolves to true if user confirmed, false if cancelled */
  showDialog: (options: DialogOptions) => Promise<boolean>;
  /** Shows an in-app alert modal (no confirm needed) */
  showAlert: (options: AlertOptions | string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(e, { offset, velocity }) => {
        const swipeThreshold = 75;
        const velocityThreshold = 500;
        if (
          Math.abs(offset.x) > swipeThreshold ||
          Math.abs(velocity.x) > velocityThreshold
        ) {
          onRemove(toast.id);
        }
      }}
      className={`pointer-events-auto flex items-start sm:items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xl rounded-xl w-auto max-w-full sm:max-w-md ${
        toast.type === "error"
          ? "bg-red-600 text-white"
          : toast.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
      }`}
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <div className="flex-shrink-0 mt-0.5 sm:mt-0">
          {toast.type === "error" && (
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          {toast.type === "success" && (
            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          )}
          {toast.type === "info" && <Info className="w-4 h-4 sm:w-5 sm:h-5" />}
        </div>
        <p className="text-[13px] sm:text-sm font-medium leading-relaxed break-words">
          {toast.message}
        </p>
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1.5 sm:p-1.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors mt-0 sm:mt-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </button>
    </motion.div>
  );
}

function DialogModal({
  dialog,
  onClose,
}: {
  dialog: DialogState;
  onClose: (confirmed: boolean) => void;
}) {
  const isDanger = dialog.variant === "danger";
  return (
    <motion.div
      key={dialog.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(0,0,0,0.4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose(false);
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Icon + Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                isDanger
                  ? "bg-red-100 dark:bg-red-900/40"
                  : "bg-gray-100 dark:bg-gray-800"
              }`}
            >
              {isDanger ? (
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              ) : (
                <Info className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              )}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {dialog.title && (
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {dialog.title}
                </h2>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {dialog.message}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-5 flex items-center justify-end gap-2.5">
          <button
            onClick={() => onClose(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {dialog.cancelLabel || "Cancel"}
          </button>
          <button
            onClick={() => onClose(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDanger
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900"
            }`}
          >
            {dialog.confirmLabel || "Confirm"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AlertModal({
  alert,
  onClose,
}: {
  alert: AlertState;
  onClose: () => void;
}) {
  const iconMap = {
    error: {
      icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
      bg: "bg-red-100 dark:bg-red-900/40",
    },
    success: {
      icon: (
        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
      ),
      bg: "bg-emerald-100 dark:bg-emerald-900/40",
    },
    info: {
      icon: <Info className="w-5 h-5 text-gray-700 dark:text-gray-300" />,
      bg: "bg-gray-100 dark:bg-gray-800",
    },
  };
  const variant = alert.variant || "info";
  const { icon, bg } = iconMap[variant];

  return (
    <motion.div
      key={alert.id}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[200] flex items-center justify-center px-4"
      style={{
        backdropFilter: "blur(4px)",
        backgroundColor: "rgba(0,0,0,0.4)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ type: "spring", stiffness: 420, damping: 30 }}
        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-2xl rounded-2xl w-full max-w-sm overflow-hidden"
      >
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${bg}`}
            >
              {icon}
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              {alert.title && (
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  {alert.title}
                </h2>
              )}
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100 rounded-lg transition-colors"
          >
            OK
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [alertModal, setAlertModal] = useState<AlertState | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const showErrorToast = useCallback(
    (error: unknown) => {
      let message = "An unexpected error occurred. Please try again.";
      if (error instanceof Error) {
        if (
          error.message.includes("Failed to fetch") ||
          error.message.includes("fetch") ||
          error.message.includes("Failed to connect to backend server")
        ) {
          message = "Failed to connect to the backend server.";
        } else if (
          error.message.includes("http") ||
          error.message.includes("api/")
        ) {
          message = "The API request failed.";
        } else {
          message = error.message;
        }
      } else if (typeof error === "string") {
        message = error;
      }
      showToast(message, "error");
    },
    [showToast],
  );

  const showDialog = useCallback((options: DialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      const id = Math.random().toString(36).substring(2, 9);
      resolveRef.current = resolve;
      setDialog({ ...options, id, resolve });
    });
  }, []);

  const handleDialogClose = useCallback((confirmed: boolean) => {
    resolveRef.current?.(confirmed);
    resolveRef.current = null;
    setDialog(null);
  }, []);

  const showAlert = useCallback((options: AlertOptions | string) => {
    const id = Math.random().toString(36).substring(2, 9);
    if (typeof options === "string") {
      setAlertModal({ id, message: options });
    } else {
      setAlertModal({ id, ...options });
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider
      value={{ showToast, showErrorToast, showDialog, showAlert }}
    >
      {children}

      {/* Global Toast Container */}
      <div className="fixed top-20 inset-x-0 z-[100] flex flex-col items-center gap-2 pointer-events-none px-4 sm:px-6">
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <AnimatePresence>
        {dialog && <DialogModal dialog={dialog} onClose={handleDialogClose} />}
      </AnimatePresence>

      {/* Alert Modal */}
      <AnimatePresence>
        {alertModal && (
          <AlertModal alert={alertModal} onClose={() => setAlertModal(null)} />
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
