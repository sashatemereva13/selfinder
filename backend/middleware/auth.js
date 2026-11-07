import User from "../models/User.js";
import { verifySessionToken } from "../utils/tokens.js";

// A valid signature only proves the server issued this token at some point.
// Every request also checks the account as it is *now* (complete mediation):
// it still exists, the token hasn't been revoked by a password change, and
// the role comes from the database rather than from a token that may be up
// to 30 days old.
async function authenticate(token) {
  const claims = verifySessionToken(token);
  const user = await User.findOne({ id: claims.id }, "id username role tokenVersion").lean();
  if (!user || (claims.tv ?? 0) !== (user.tokenVersion ?? 0)) {
    throw new Error("Session revoked or account gone");
  }
  return { id: user.id, username: user.username, role: user.role };
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or malformed token" });
  }

  let user;
  try {
    user = await authenticate(header.slice(7));
  } catch {
    return res.status(401).json({ error: "Token invalid or expired" });
  }
  req.user = user;
  next();
}

// Populates req.user if a valid token is present, but does not block unauthenticated requests.
export async function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.user = await authenticate(header.slice(7));
    } catch {
      // invalid token — proceed anonymously
    }
  }
  next();
}

// Run after requireAuth. Restricts a route to a given role (read from the
// database by requireAuth, not from the token).
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: "Insufficient role" });
    }
    next();
  };
}
