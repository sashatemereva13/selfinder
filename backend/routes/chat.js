import { Router } from "express";
import { postBadgeComment, postChat, postJourneyLine, postSafetyCheck } from "../controllers/chatController.js";
import { publicAiLimiter, publicExpensiveAiLimiter, aiBudgetMiddleware } from "../middleware/aiRequestLimits.js";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";

const router = Router();
router.post("/badge-comment", publicAiLimiter, aiBudgetMiddleware, postBadgeComment);
router.post("/journey-line", publicAiLimiter, aiBudgetMiddleware, postJourneyLine);
router.post("/safety-check", requireAiProcessingConsent, publicAiLimiter, aiBudgetMiddleware, postSafetyCheck);
router.post("/", requireAiProcessingConsent, publicExpensiveAiLimiter, aiBudgetMiddleware, postChat);
export default router;
