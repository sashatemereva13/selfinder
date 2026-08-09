import { Router } from "express";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth.js";
import { postFeedback, getAllFeedback } from "../controllers/feedbackController.js";

const router = Router();
router.post("/", optionalAuth, postFeedback);
router.get("/", requireAuth, requireRole("admin"), getAllFeedback);
export default router;
