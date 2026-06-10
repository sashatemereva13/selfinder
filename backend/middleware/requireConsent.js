import { users } from "../stores.js";

export function requireConsent(req, res, next) {
  const user = users.find((u) => u.id === req.user.id);
  if (!user?.consent?.psychologicalData?.given) {
    return res.status(403).json({
      error: "Consent for storing psychological data is required.",
      code: "CONSENT_REQUIRED",
    });
  }
  next();
}
