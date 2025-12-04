import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import Button from "../common/Button";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "dark" ? SunIcon : MoonIcon;
  const label = theme === "dark" ? "Light" : "Dark";
  return (
    <Button
      size="sm"
      variant="ghost"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="px-2"
      icon={<Icon className="h-4 w-4" />}
    >
      <span className="hidden md:inline">{label}</span>
    </Button>
  );
}
