import React from "react";
import classNames from "classnames";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon,
  className = "",
  ...props
}) {
  const base =
    "inline-flex items-center gap-2 font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const variants = {
    primary:
      "bg-button-primary text-text-button hover:bg-button-hover focus-visible:ring-focus-primary",
    ghost:
      "bg-transparent text-text-primary border border-border-primary hover:bg-bg-tertiary focus-visible:ring-focus-primary",
    subtle: "bg-bg-tertiary text-text-primary hover:bg-bg-details focus-visible:ring-focus-primary"
  };
  const sizes = {
    sm: "text-sm px-3 py-1.5",
    md: "text-sm px-4 py-2",
    lg: "text-base px-5 py-2.5"
  };

  return (
    <button className={classNames(base, variants[variant], sizes[size], className)} {...props}>
      {icon}
      {children}
    </button>
  );
}
