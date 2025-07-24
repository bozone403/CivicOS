import { registerLeaksRoutes } from "./leaks.js";
import { registerMemoryRoutes } from "./memory.js";
import { registerCorruptionRoutes } from "./corruption.js";
import { registerCasesRoutes } from "./cases.js";
import { registerDashboardRoutes } from "./dashboard.js";
import { registerVotingRoutes } from "./voting.js";
import { registerPetitionRoutes } from "./petitions.js";
import { registerRightsRoutes } from "./rights.js";
import { registerPoliticiansRoutes } from "./politicians.js";
import { registerLegalRoutes } from "./legal.js";
import { registerNewsRoutes } from "./news.js";
import { registerBillsRoutes } from "./bills.js";
import { registerAIRoutes } from "./ai.js";
export function registerApiRoutes(app) {
    registerLeaksRoutes(app);
    registerMemoryRoutes(app);
    registerCorruptionRoutes(app);
    registerCasesRoutes(app);
    registerDashboardRoutes(app);
    registerVotingRoutes(app);
    registerPetitionRoutes(app);
    registerRightsRoutes(app);
    registerPoliticiansRoutes(app);
    registerLegalRoutes(app);
    registerNewsRoutes(app);
    registerBillsRoutes(app);
    registerAIRoutes(app);
}
