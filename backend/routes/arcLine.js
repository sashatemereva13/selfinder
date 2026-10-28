import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { getArcLine } from "../controllers/arcLineController.js";
import { accountExpensiveAiLimiter, aiBudgetMiddleware } from "../middleware/aiRequestLimits.js";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";

const router = Router();
// Same consent bar as Crossing/wish — this reads the user's own reading
// history and active wish to build the line.
router.post("/", requireAuth, requireConsent, requireAiProcessingConsent, accountExpensiveAiLimiter, aiBudgetMiddleware, getArcLine);
export default router;
