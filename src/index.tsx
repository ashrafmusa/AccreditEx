import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "@/App";

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Debug: Check if we're in DEV mode
console.log("🔧 Environment:", {
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
});

// Only use StrictMode in development to avoid double-firing in production
const AppWithStrictMode = import.meta.env.DEV ? (
  <React.StrictMode>
    <App />
  </React.StrictMode>
) : (
  <App />
);

console.log("✅ StrictMode enabled:", import.meta.env.DEV);

root.render(AppWithStrictMode);
