# Arbitrix App Frontend Architecture

## 1. Tech Stack & Key Packages

The application is a Single Page Application (SPA) built on a modern React stack.

*   **Core:** React 18, React Router DOM (v6 data router).
*   **State & Data Fetching:** @tanstack/react-query (v5). This is the backbone of the app, handling caching, polling, and server state.
*   **HTTP Client:** Axios (configured with interceptors).
*   **Styling:** Tailwind CSS with a custom CSS variable theme system (`src/styles/theme.css`).
*   **Icons:** `@heroicons/react`.
*   **Visualization:** `lightweight-charts` (TradingView) for financial data and `recharts` (implied) for other metrics.
*   **Layout:** `react-grid-layout` for the drag-and-drop Studio dashboard.

## 2. Repository & File Structure

The project follows a "feature-based" organization mixed with a "type-based" separation for shared utilities.

```text
src/
├── api/                # API Layer
│   ├── httpClient.js   # Axios instance with Auth interceptors
│   ├── resources.js    # Domain-specific API calls (fetchStrategies, killTask, etc.)
│   └── openApiClient.js # Caching wrapper for OpenAPI specs
├── components/         # UI Components
│   ├── common/         # Reusable primitives (Modal, DataTable, StatCard, StatusBadge)
│   ├── layout/         # Structural components (Sidebar, Topbar, ToastStack)
│   └── [domain]/       # Feature-specific components (optimizations/, backtests/, charts/)
├── context/            # Global State
│   ├── AuthContext.jsx # User session & boot logic
│   └── UiContext.jsx   # Toasts, sidebar toggle, theme timers
├── hooks/              # Custom Hooks
│   ├── useTheme.js     # Dark/Light mode logic
│   └── useMediaQuery.js
├── layouts/            # Page Wrappers
│   ├── DashboardLayout.jsx # Authenticated shell (Sidebar + Outlet)
│   └── AuthLayout.jsx      # Login screen wrapper
├── pages/              # Route Views (Page-level logic)
│   ├── dashboard/, strategies/, optimizations/, etc.
├── routes/             # Routing Configuration
│   └── appRouter.js    # Central route definitions
├── styles/             # Global Styles
│   ├── tailwind.css    # Tailwind directives
│   └── theme.css       # CSS Variables for theming
└── utils/              # Pure Functions
    ├── formatters.js   # Date/Number formatting
    ├── payloadQueue.js # SessionStorage helpers for cross-tab data passing
    └── tasks.js        # Task status helpers
```

## 3. Architecture & Communication Patterns

If you want to build an app "the same way," follow these patterns found in the workspace:

### A. Data Flow (Server State)
Instead of Redux or a global store for data, the app relies entirely on **React Query**.
*   **Fetching:** Components use `useQuery` hooks defined inline or in custom hooks.
*   **Polling:** Real-time updates (like job progress) are handled by passing `refetchInterval` to `useQuery`. The interval duration is often pulled from `UiContext` (e.g., `fastTimer`, `slowTimer`).
*   **Mutations:** Actions (start job, kill task) use `useMutation`. On success, they trigger `queryClient.invalidateQueries` to refresh the UI automatically.

**Example Pattern:**
```javascript
// In a Page component
const { data, isLoading } = useQuery({
  queryKey: ["strategies"],
  queryFn: fetchStrategies,
  refetchInterval: 5000 // Poll every 5s
});
```

### B. API Layer
The API is decoupled from the UI.
1.  **`src/api/httpClient.js`**: Sets up the base URL and injects the Bearer token from `localStorage` automatically. It also handles 401/403 errors globally.
2.  **`src/api/resources.js`**: Contains named async functions (e.g., `fetchStrategies`, `createBacktest`). The UI components import these functions, they never call `axios.get` directly.

### C. Component Communication
*   **Props:** Used for direct parent-child data passing (e.g., passing `rows` to `DataTable`).
*   **Context (`UiContext`):** Used for "action at a distance" specifically for UI feedback.
    *   *Toasts:* Any component can call `pushToast` to show a notification without worrying about the DOM.
    *   *Timers:* Centralized timer durations ensure all polling components slow down or speed up in sync.
*   **Session Storage (`payloadQueue.js`):** Used to pass complex data between pages without URL clutter. For example, "Load into form" saves a JSON payload to Session Storage, redirects the user, and the target page reads that storage on mount.

### D. Theming
The app uses **CSS Variables** defined in `theme.css` referenced by Tailwind config.
*   Instead of `bg-gray-900 dark:bg-white`, the code uses `bg-bg-primary`.
*   `--bg-primary` changes value based on the `[data-theme]` attribute on the `<html>` tag.
*   This makes the codebase cleaner and the theme hot-swappable via `useTheme.js`.

### E. Dynamic Forms
A specific pattern used in `StrategyParameterInputs` (implied usage) is **Metadata-Driven UI**.
*   The backend sends parameter definitions (type: int, min: 0, max: 10).
*   The frontend dynamically renders the correct input widget (Slider, Checkbox, JSON Textarea) based on that metadata.

## 4. Key Hooks to Replicate

1.  **`useAuth`**: Handles the "Bootstrapping" phase. It checks for a token, fetches the user profile, and blocks rendering of the main app until this check is complete (showing a `SplashScreen`).
2.  **`useUi`**: Exposes `pushToast(title, message, tone)` and manages the sidebar state for mobile.
3.  **`useQuery` (TanStack)**: Used everywhere. You should replicate the pattern of using query keys like `['entity', id]` for granular cache invalidation.

## Summary Checklist for your new App

1.  **Setup Axios** with a global interceptor for tokens.
2.  **Wrap App** in `QueryClientProvider`, `AuthProvider`, and `UiProvider`.
3.  **Create a Layout** component that renders `Sidebar`, `Topbar`, and `<Outlet />`.
4.  **Use React Query** for all API data; do not use `useEffect` for fetching data.
5.  **Define Theme Variables** in CSS and map them in `tailwind.config.js`.
6.  **Use Context** only for global UI state (Toasts, User, Theme), not for domain data.
