import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { postMeasureResults } from "../controllers/measureController.js";
import { postMeasureInterview } from "../controllers/chatController.js";

const router = Router();
router.post("/results", optionalAuth, postMeasureResults);
router.post("/interview", postMeasureInterview);
export default router;
