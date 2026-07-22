import { Router } from "express";
import { postEvents } from "../controllers/eventsController.js";

const router = Router();
router.post("/", postEvents);
export default router;
