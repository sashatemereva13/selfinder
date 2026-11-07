import { signConsentToken } from "../utils/tokens.js";

export const AI_DISCLOSURE_VERSION = "2026-09-26";

export async function grantAiProcessingConsent(req, res) {
  const { accepted, version } = req.body ?? {};
  if (accepted !== true || version !== AI_DISCLOSURE_VERSION) {
    return res.status(400).json({ error: "AI processing consent is required" });
  }

  const token = signConsentToken(AI_DISCLOSURE_VERSION);
  res.json({ token, version: AI_DISCLOSURE_VERSION });
}
