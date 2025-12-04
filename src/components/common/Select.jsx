import React from "react";
import classNames from "classnames";

export default function Select({ label, options = [], className = "", ...props }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-text-secondary">
      {label && <span className="font-medium text-text-primary">{label}</span>}
      <select
        className={classNames(
          "rounded-md border border-border-primary bg-bg-primary px-3 py-2 text-text-primary focus:border-focus-primary focus:outline-none focus:ring-2 focus:ring-focus-primary/60",
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
