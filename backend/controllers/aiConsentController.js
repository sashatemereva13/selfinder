import jwt from "jsonwebtoken";

export const AI_DISCLOSURE_VERSION = "2026-09-26";

export async function grantAiProcessingConsent(req, res) {
  const { accepted, version } = req.body ?? {};
  if (accepted !== true || version !== AI_DISCLOSURE_VERSION) {
    return res.status(400).json({ error: "AI processing consent is required" });
  }

  const token = jwt.sign(
    { purpose: "ai_processing_consent", version: AI_DISCLOSURE_VERSION },
    process.env.JWT_SECRET,
    { expiresIn: "365d", audience: "selfinder-ai-processing" }
  );
  res.json({ token, version: AI_DISCLOSURE_VERSION });
}
