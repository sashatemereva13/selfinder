import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { saveConversation, getConversation, getConversationsByMeasureResult } from "../controllers/conversationController.js";

const router = Router();
router.post("/save", requireAuth, requireConsent, saveConversation);
// Must come before "/:id" — otherwise Express would match "by-measure-result"
// itself as an :id value.
router.get("/by-measure-result/:measureResultId", requireAuth, getConversationsByMeasureResult);
router.get("/:id", requireAuth, getConversation);
export default router;
