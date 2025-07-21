import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const fallbackQueryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={fallbackQueryClient}>
    <App />
  </QueryClientProvider>
);
