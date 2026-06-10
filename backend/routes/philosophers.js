import { Router } from "express";
import { getPhilosophers } from "../controllers/philosophersController.js";

const router = Router();
router.get("/", getPhilosophers);
export default router;
