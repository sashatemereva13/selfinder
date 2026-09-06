import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  postJourneyExchange,
  getJourneySession,
  getJourneySessions,
  postJourneyPurchase,
} from "../controllers/journeyController.js";

const router = Router();
router.use(requireAuth);
router.post("/exchange", postJourneyExchange);
router.get("/session", getJourneySession);
router.get("/sessions", getJourneySessions);
router.post("/purchase", postJourneyPurchase);
export default router;
