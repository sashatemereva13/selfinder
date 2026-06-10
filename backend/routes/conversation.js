import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { saveConversation, getConversation } from "../controllers/conversationController.js";

const router = Router();
router.post("/save", requireAuth, requireConsent, saveConversation);
router.get("/:id", requireAuth, getConversation);
export default router;
