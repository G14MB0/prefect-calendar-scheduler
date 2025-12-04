# Arbitrix App Style Guide

This document outlines the styling system used in the Arbitrix App. It leverages **Tailwind CSS** combined with **CSS Variables** to support a robust, hot-swappable Dark/Light mode.

## 1. Core Philosophy

*   **Semantic Naming:** Colors are named by their *function* (e.g., `bg-primary`, `text-error`) rather than their hue (e.g., `white`, `red-500`).
*   **CSS Variables:** All dynamic colors are defined as CSS variables in `src/styles/theme.css`.
*   **Tailwind Abstraction:** Tailwind is configured to use these variables, so you write `<div className="bg-bg-primary">` instead of hardcoding colors.

## 2. Color Palette (Theming)

The theme is defined in `src/styles/theme.css`.

### Light Mode (`:root`)
| Variable | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-primary` | `#ffffff` | Main content backgrounds (cards, panels) |
| `--bg-secondary` | `#f7f8f9` | App background, sidebar |
| `--bg-tertiary` | `#eef1f6` | Hover states, subtle inputs |
| `--bg-details` | `#d7dde5` | Borders, dividers, disabled states |
| `--text-primary` | `#0f172a` | Headings, main body text |
| `--text-secondary` | `#1e293b` | Secondary text, labels |
| `--text-tertiary` | `#64748b` | Muted text, placeholders |
| `--text-error` | `#dc2626` | Error messages, destructive actions |
| `--button-primary` | `#2563eb` | Primary action buttons |
| `--focus-primary` | `#3b82f6` | Focus rings |

### Dark Mode (`:root.dark`)
| Variable | Hex | Usage |
| :--- | :--- | :--- |
| `--bg-primary` | `#0f172a` | Main content backgrounds |
| `--bg-secondary` | `#111c32` | App background |
| `--bg-tertiary` | `#1f2a44` | Hover states |
| `--bg-details` | `#24304d` | Borders |
| `--text-primary` | `#f8fafc` | Headings |
| `--text-secondary` | `#e2e8f0` | Secondary text |
| `--text-tertiary` | `#cbd5f5` | Muted text |
| `--text-error` | `#f97316` | Error messages (Orange in dark mode) |
| `--button-primary` | `#60a5fa` | Primary action buttons |

## 3. Tailwind Configuration (`tailwind.config.js`)

The `tailwind.config.js` file maps the CSS variables to utility classes.

### Custom Colors
```javascript
colors: {
  bg: {
    primary: "var(--bg-primary)",   // Usage: bg-bg-primary
    secondary: "var(--bg-secondary)", // Usage: bg-bg-secondary
    tertiary: "var(--bg-tertiary)",
    details: "var(--bg-details)",
  },
  border: {
    primary: "var(--border)",       // Usage: border-border-primary
    secondary: "var(--border-secondary)",
  },
  text: {
    primary: "var(--text-primary)", // Usage: text-text-primary
    secondary: "var(--text-secondary)",
    tertiary: "var(--text-tertiary)",
    button: "var(--text-button)",
    error: "var(--text-error)",
  },
  button: {
    primary: "var(--button-primary)", // Usage: bg-button-primary
    hover: "var(--button-hover)",
  },
  focus: {
    primary: "var(--focus-primary)",  // Usage: ring-focus-primary
  },
}
```

### Typography (Font Sizes)
The app uses a custom scale for font sizes to ensure readability.
*   `text-xs`: 12px
*   `text-sm`: ~13px (0.813rem) - *Commonly used for dense data tables*
*   `text-base`: ~15px (0.938rem) - *Default body text*
*   `text-lg`: ~17px (1.063rem)
*   `text-xl`: 20px

### Shadows
*   `shadow-custom`: `0 0 6px -0.5px var(--tw-shadow-color)` - Used for subtle depth.

## 4. Global Styles (`src/styles/tailwind.css`)

*   **Font Family:** `"Inter", system-ui, sans-serif`
*   **Scrollbars:** Custom styled scrollbars that adapt to the theme variables (`--scrollbar-thumb`, etc.).
    ```css
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ```

## 5. How to Replicate

1.  **Create `src/styles/theme.css`:** Copy the CSS variables for `:root` and `:root.dark`.
2.  **Configure Tailwind:** Update `tailwind.config.js` to extend the theme with these variables.
3.  **Import Styles:** Import both `tailwind.css` and `theme.css` in your entry point (`index.js` or `App.js`).
4.  **Dark Mode Toggle:** Implement a hook (like `useTheme`) that toggles the `.dark` class on the `<html>` element.
5.  **Runtime Color Resolution:** If you use canvas libraries (like Charts) that can't read CSS variables, use a helper like `src/utils/colors.js` to resolve `var(--bg-primary)` to a hex code at runtime.



