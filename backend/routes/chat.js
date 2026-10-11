import { Router } from "express";
import { postBadgeComment, postChat, postJourneyLine, postSafetyCheck } from "../controllers/chatController.js";

const router = Router();
router.post("/badge-comment", postBadgeComment);
router.post("/journey-line", postJourneyLine);
router.post("/safety-check", postSafetyCheck);
router.post("/", postChat);
export default router;
