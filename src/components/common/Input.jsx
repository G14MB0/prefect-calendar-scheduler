import React from "react";
import classNames from "classnames";

export default function Input({ label, hint, error, className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-text-secondary">
      {label && <span className="font-medium text-text-primary">{label}</span>}
      <input
        className={classNames(
          "rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-text-primary placeholder:text-text-tertiary focus:border-focus-primary focus:outline-none focus:ring-2 focus:ring-focus-primary/60",
          className
        )}
        {...props}
      />
      {hint && <span className="text-xs text-text-tertiary">{hint}</span>}
      {error && <span className="text-xs text-text-error">{error}</span>}
    </label>
  );
}
