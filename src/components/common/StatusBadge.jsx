import React from "react";
import classNames from "classnames";

const toneMap = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
  running: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
  scheduled: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100",
  failed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  crashed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
  cancelled: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100",
  unknown: "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
};

export default function StatusBadge({ state = "unknown" }) {
  const key = String(state || "unknown").toLowerCase();
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
        toneMap[key] || toneMap.unknown
      )}
    >
      {state}
    </span>
  );
}
