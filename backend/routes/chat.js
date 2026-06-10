import { Router } from "express";
import { postBadgeComment, postChat, postJourneyLine } from "../controllers/chatController.js";

const router = Router();
router.post("/badge-comment", postBadgeComment);
router.post("/journey-line", postJourneyLine);
router.post("/", postChat);
export default router;
