import axios from "axios";

let currentSettings = {
  apiUrl: "",
  apiKey: "",
  workspace: ""
};

const client = axios.create({
  baseURL: currentSettings.apiUrl,
  timeout: 15000
});

client.interceptors.request.use((config) => {
  if (currentSettings.apiKey) {
    config.headers.Authorization = `Bearer ${currentSettings.apiKey}`;
  }
  if (currentSettings.workspace) {
    config.headers["X-Prefect-Workspace"] = currentSettings.workspace;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    // Preserve the original error with response info for status code checking in fallback logic
    const message = error?.response?.data?.detail || error?.message || "Request failed";
    error.message = message;
    return Promise.reject(error);
  }
);

export function configureHttpClient(settings) {
  currentSettings = settings;
  client.defaults.baseURL = settings.apiUrl || "";
}

export function getHttpClient() {
  return client;
}

export function getUiBaseUrl() {
  if (!currentSettings.apiUrl) return "";
  // Strip trailing /api if present to build UI links
  return currentSettings.apiUrl.replace(/\/api\/?$/, "");
}
