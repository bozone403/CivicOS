import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const fallbackQueryClient = new QueryClient();
console.log("[main.tsx] Rendering App with fallback QueryClientProvider");

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={fallbackQueryClient}>
    <App />
  </QueryClientProvider>
);
