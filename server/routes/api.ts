import { Express } from "express";
import { registerLeaksRoutes } from "./leaks.js";
import { registerMemoryRoutes } from "./memory.js";
import { registerCorruptionRoutes } from "./corruption.js";
import { registerCasesRoutes } from "./cases.js";
import { registerDashboardRoutes } from "./dashboard.js";
import { registerVotingRoutes } from "./voting.js";
import { registerPetitionsRoutes } from "./petitions.js";

export function registerApiRoutes(app: Express) {
  registerLeaksRoutes(app);
  registerMemoryRoutes(app);
  registerCorruptionRoutes(app);
  registerCasesRoutes(app);
  registerDashboardRoutes(app);
  registerVotingRoutes(app);
  registerPetitionsRoutes(app);
} 