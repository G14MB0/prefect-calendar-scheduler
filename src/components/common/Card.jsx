import React from "react";
import classNames from "classnames";

export default function Card({ title, description, action, children, className = "" }) {
  return (
    <div className={classNames("bg-bg-primary rounded-lg border border-border-primary shadow-sm p-4", className)}>
      {(title || description || action) && (
        <div className="mb-3 flex items-start justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
            {description && <p className="text-sm text-text-tertiary">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
