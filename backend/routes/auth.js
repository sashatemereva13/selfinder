import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  register,
  login,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from "../controllers/authController.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/change-password", requireAuth, changePassword);
router.post("/forgot-password", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
