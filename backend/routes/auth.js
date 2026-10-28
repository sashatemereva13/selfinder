import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  refresh,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";
import { passwordResetRequestLimiter, passwordResetSubmitLimiter } from "../middleware/aiRequestLimits.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", requireAuth, refresh);
router.post("/change-password", requireAuth, changePassword);
router.post("/forgot-password", passwordResetRequestLimiter, requestPasswordReset);
router.post("/reset-password", passwordResetSubmitLimiter, resetPassword);

export default router;
