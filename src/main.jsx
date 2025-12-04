import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import { UiProvider } from "./context/UiContext";
import { ConnectionProvider } from "./context/ConnectionContext";
import "./styles/theme.css";
import "./styles/tailwind.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <UiProvider>
          <ConnectionProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ConnectionProvider>
        </UiProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
