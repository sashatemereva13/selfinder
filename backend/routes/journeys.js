import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  postJourneyExchange,
  getJourneySession,
  getJourneySessions,
  postJourneyPurchase,
} from "../controllers/journeyController.js";
import { accountExpensiveAiLimiter, aiBudgetMiddleware } from "../middleware/aiRequestLimits.js";
import { requireAiProcessingConsent } from "../middleware/requireAiProcessingConsent.js";

const router = Router();
router.use(requireAuth);
router.post("/exchange", requireAiProcessingConsent, accountExpensiveAiLimiter, aiBudgetMiddleware, postJourneyExchange);
router.get("/session", getJourneySession);
router.get("/sessions", getJourneySessions);
router.post("/purchase", postJourneyPurchase);
export default router;
