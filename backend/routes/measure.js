import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { postMeasureResults } from "../controllers/measureController.js";
import { postMeasureInterview, postMeasureExchange } from "../controllers/chatController.js";

const router = Router();
router.post("/results", optionalAuth, postMeasureResults);
router.post("/interview", postMeasureInterview);
router.post("/exchange", postMeasureExchange);
export default router;
