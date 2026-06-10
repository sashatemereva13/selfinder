import { Router } from "express";
import { optionalAuth } from "../middleware/auth.js";
import { postMeasureResults } from "../controllers/measureController.js";

const router = Router();
router.post("/results", optionalAuth, postMeasureResults);
export default router;
