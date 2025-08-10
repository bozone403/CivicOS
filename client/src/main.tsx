import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const fallbackQueryClient = new QueryClient();

const rootEl = document.getElementById("root");
if (!rootEl) {
  const warn = document.createElement('div');
  warn.textContent = 'CivicOS failed to mount: missing #root';
  warn.style.cssText = 'padding:12px;color:#b91c1c;background:#fee2e2;border:1px solid #fecaca;margin:8px;border-radius:6px;';
  document.body.prepend(warn);
} else {
  createRoot(rootEl).render(
  <QueryClientProvider client={fallbackQueryClient}>
    <App />
  </QueryClientProvider>
  );
}
