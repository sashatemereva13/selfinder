import { Router } from "express";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { getMeasureHistory } from "../controllers/measureController.js";
import { postMeasureInterview, postMeasureExchange } from "../controllers/chatController.js";

const router = Router();
router.post("/interview", optionalAuth, postMeasureInterview);
router.post("/exchange", postMeasureExchange);
router.get("/history", requireAuth, getMeasureHistory);
export default router;
