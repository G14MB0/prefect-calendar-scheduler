import React from "react";
import classNames from "classnames";

export default function Spinner({ className = "" }) {
  return (
    <div className={classNames("h-4 w-4 animate-spin rounded-full border-2 border-bg-details border-t-button-primary", className)} />
  );
}
