import { Router } from "express";
import { grantAiProcessingConsent } from "../controllers/aiConsentController.js";
import { publicAiLimiter } from "../middleware/aiRequestLimits.js";

const router = Router();
router.post("/grant", publicAiLimiter, grantAiProcessingConsent);
export default router;
