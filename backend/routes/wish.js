import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { requireConsent } from "../middleware/requireConsent.js";
import { saveWish, getWish, listMyWishes } from "../controllers/wishController.js";

const router = Router();
router.post("/save", requireAuth, requireConsent, saveWish);
// A wish is more sensitive/personal than a Spill entry by its own
// framing ("sacred, the user's own" — see docs/session-result-concept.md)
// — reads are held to the same consent bar as the write here, unlike
// Spill's routes (spill.js), where only the save route requires consent.
// Must come before "/:id" — otherwise Express would match "mine" itself
// as an :id value.
router.get("/mine", requireAuth, requireConsent, listMyWishes);
router.get("/:id", requireAuth, requireConsent, getWish);
export default router;
