import { registerLeaksRoutes } from "./leaks.js";
import { registerMemoryRoutes } from "./memory.js";
import { registerCorruptionRoutes } from "./corruption.js";
import { registerCasesRoutes } from "./cases.js";
import { registerDashboardRoutes } from "./dashboard.js";
import { registerVotingRoutes } from "./voting.js";
import { registerPetitionsRoutes } from "./petitions.js";
import { registerRightsRoutes } from "./rights.js";
export function registerApiRoutes(app) {
    registerLeaksRoutes(app);
    registerMemoryRoutes(app);
    registerCorruptionRoutes(app);
    registerCasesRoutes(app);
    registerDashboardRoutes(app);
    registerVotingRoutes(app);
    registerPetitionsRoutes(app);
    registerRightsRoutes(app);
}
