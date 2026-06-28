import User from "../models/User.js";

export async function requireConsent(req, res, next) {
  const user = await User.findOne({ id: req.user.id });
  if (!user?.consent?.psychologicalData?.given) {
    return res.status(403).json({
      error: "Consent for storing psychological data is required.",
      code: "CONSENT_REQUIRED",
    });
  }
  next();
}
