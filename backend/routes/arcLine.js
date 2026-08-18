import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { getArcLine } from "../controllers/arcLineController.js";

const router = Router();
// Same consent bar as Crossing/wish — this reads the user's own reading
// history and active wish to build the line.
router.post("/", requireAuth, requireConsent, getArcLine);
export default router;
