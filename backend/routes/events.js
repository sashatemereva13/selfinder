import { Router } from "express";
import { postEvents } from "../controllers/eventsController.js";
import { eventsRateLimiter } from "../middleware/aiRequestLimits.js";

const router = Router();
router.post("/", eventsRateLimiter, postEvents);
export default router;
