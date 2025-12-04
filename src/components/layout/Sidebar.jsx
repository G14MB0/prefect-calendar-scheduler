import React from "react";
import { NavLink } from "react-router-dom";
import {
  CalendarDaysIcon,
  ListBulletIcon,
  Cog6ToothIcon,
  ClockIcon,
  RectangleStackIcon
} from "@heroicons/react/24/outline";
import classNames from "classnames";
import { useUi } from "../../context/UiContext";
import ThemeToggle from "../theme/ThemeToggle";

const links = [
  { to: "/calendar", label: "Calendario", icon: CalendarDaysIcon },
  { to: "/list", label: "Lista", icon: ListBulletIcon },
  { to: "/agenda", label: "Agenda", icon: ClockIcon },
  { to: "/deployments", label: "Deployment", icon: RectangleStackIcon },
  { to: "/settings", label: "Impostazioni", icon: Cog6ToothIcon }
];

export default function Sidebar() {
  const { sidebarOpen } = useUi();

  return (
    <aside
      className={classNames(
        "bg-bg-secondary border-r border-border-primary px-4 py-5 transition-all duration-200",
        sidebarOpen ? "w-64" : "w-16"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-text-secondary">
          Prefect Calendar
        </span>
        <ThemeToggle />
      </div>
      <nav className="mt-6 flex flex-col gap-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                classNames(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-tertiary",
                  isActive && "bg-bg-tertiary text-text-primary"
                )
              }
            >
              <Icon className="h-5 w-5" />
              {sidebarOpen && <span>{link.label}</span>}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
