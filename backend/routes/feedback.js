import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { postFeedback, getAllFeedback } from "../controllers/feedbackController.js";

const router = Router();
router.post("/", postFeedback);
router.get("/", requireAuth, requireRole("admin"), getAllFeedback);
export default router;
