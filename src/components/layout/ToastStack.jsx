import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import classNames from "classnames";
import { useUi } from "../../context/UiContext";

const toneStyles = {
  info: "bg-blue-50 text-blue-900 border-blue-200 dark:bg-blue-900 dark:text-blue-50 dark:border-blue-700",
  success:
    "bg-green-50 text-green-900 border-green-200 dark:bg-green-900 dark:text-green-50 dark:border-green-700",
  warning:
    "bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900 dark:text-amber-50 dark:border-amber-700",
  error:
    "bg-red-50 text-red-900 border-red-200 dark:bg-red-900 dark:text-red-50 dark:border-red-700"
};

export default function ToastStack() {
  const { toasts, setToasts } = useUi();

  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={classNames(
            "flex min-w-[260px] items-start gap-3 rounded-lg border px-4 py-3 shadow-lg",
            toneStyles[toast.tone] || toneStyles.info
          )}
        >
          <div className="flex-1">
            <p className="text-sm font-semibold">{toast.title}</p>
            <p className="text-sm opacity-90">{toast.message}</p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-sm text-text-secondary hover:text-text-primary"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
