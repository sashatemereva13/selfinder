import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { getMeasureHistory } from "../controllers/measureController.js";
import { postMeasureInterview, postMeasureExchange } from "../controllers/chatController.js";
import { publicExpensiveAiLimiter, aiBudgetMiddleware } from "../middleware/aiRequestLimits.js";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";

const router = Router();
router.post("/interview", optionalAuth, requireAiProcessingConsent, publicExpensiveAiLimiter, aiBudgetMiddleware, postMeasureInterview);
router.post("/exchange", requireAiProcessingConsent, publicExpensiveAiLimiter, aiBudgetMiddleware, postMeasureExchange);
router.get("/history", requireAuth, getMeasureHistory);
export default router;
