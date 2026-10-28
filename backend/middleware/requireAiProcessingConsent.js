import jwt from "jsonwebtoken";
import { AI_DISCLOSURE_VERSION } from "../controllers/aiConsentController.js";

export function requireAiProcessingConsent(req, res, next) {
  const token = req.get("X-AI-Consent");
  if (!token) {
    return res.status(403).json({ error: "AI processing consent is required", code: "AI_CONSENT_REQUIRED" });
  }

  try {
    const grant = jwt.verify(token, process.env.JWT_SECRET, { audience: "selfinder-ai-processing" });
    if (grant.purpose !== "ai_processing_consent" || grant.version !== AI_DISCLOSURE_VERSION) throw new Error("Invalid consent grant");
    req.aiConsent = { version: grant.version };
    next();
  } catch {
    return res.status(403).json({ error: "AI processing consent is required", code: "AI_CONSENT_REQUIRED" });
  }
}
