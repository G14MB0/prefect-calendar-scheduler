import React from "react";
import classNames from "classnames";

export default function Badge({ tone = "info", children }) {
  const tones = {
    success: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-100",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100",
    danger: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-100",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-100"
  };
  return (
    <span className={classNames("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}
