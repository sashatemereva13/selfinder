import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { generateCrossing, answerCrossing, listMyCrossings } from "../controllers/crossingController.js";
import { accountExpensiveAiLimiter, aiBudgetMiddleware } from "../middleware/aiRequestLimits.js";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";

const router = Router();
// Same consent bar as the wish itself (see wish.js) — a Crossing is built
// directly from a wish's own text plus a reading's level.
router.post("/generate", requireAuth, requireConsent, requireAiProcessingConsent, accountExpensiveAiLimiter, aiBudgetMiddleware, generateCrossing);
router.post("/:id/answer", requireAuth, requireConsent, answerCrossing);
router.get("/mine", requireAuth, requireConsent, listMyCrossings);
export default router;
