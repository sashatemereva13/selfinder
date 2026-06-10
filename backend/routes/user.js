import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMe,
  exportMyData,
  deleteMe,
  grantConsent,
  withdrawConsent,
} from "../controllers/userController.js";

const router = Router();
router.use(requireAuth);

router.get("/me", getMe);
router.get("/me/data", exportMyData);
router.delete("/me", deleteMe);
router.post("/me/consent", grantConsent);
router.delete("/me/consent", withdrawConsent);

export default router;
