import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { saveSpillEntry, getSpillEntry, listMySpillEntries } from "../controllers/spillController.js";

const router = Router();
router.post("/save", requireAuth, requireConsent, saveSpillEntry);
// Must come before "/:id" — otherwise Express would match "mine" itself as
// an :id value.
router.get("/mine", requireAuth, listMySpillEntries);
router.get("/:id", requireAuth, getSpillEntry);
export default router;
