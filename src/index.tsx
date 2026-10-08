import App from "@/App";
import { initializeCapacitor } from "@/utils/capacitorInit";
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

// After a deploy, old tabs request deleted chunks; reload once to get the new build
window.addEventListener("vite:preloadError", () => {
  if (!sessionStorage.getItem("chunk-reload")) {
    sessionStorage.setItem("chunk-reload", "1");
    window.location.reload();
  }
});

// Initialize Capacitor native plugins (no-op on web)
initializeCapacitor();

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Only use StrictMode in development to avoid double-firing in production
const AppWithStrictMode = import.meta.env.DEV ? (
  <React.StrictMode>
    <App />
  </React.StrictMode>
) : (
  <App />
);

root.render(AppWithStrictMode);
