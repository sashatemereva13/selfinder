import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { postJourneyExchange, getJourneySession } from "../controllers/journeyController.js";

const router = Router();
router.use(requireAuth);
router.post("/exchange", postJourneyExchange);
router.get("/session", getJourneySession);
export default router;
