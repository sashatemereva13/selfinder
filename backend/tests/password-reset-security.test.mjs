import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generateResetCode } from "../utils/resetCode.js";
import { passwordResetRequestLimiter, passwordResetSubmitLimiter } from "../middleware/aiRequestLimits.js";

test("password reset codes are six decimal digits", () => {
  for (let i = 0; i < 100; i += 1) {
    assert.match(generateResetCode(), /^\d{6}$/);
  }
});

test("reset code generation uses node crypto randomInt", async () => {
  const source = await readFile(new URL("../utils/resetCode.js", import.meta.url), "utf8");
  assert.match(source, /import\s*\{\s*randomInt\s*\}\s*from\s*["']node:crypto["']/);
  assert.doesNotMatch(source, /Math\.random/);
});

test("both reset endpoints have dedicated IP-based hourly limiters", async () => {
  const source = await readFile(new URL("../routes/auth.js", import.meta.url), "utf8");
  assert.match(source, /router\.post\("\/forgot-password",\s*passwordResetRequestLimiter,\s*requestPasswordReset\)/);
  assert.match(source, /router\.post\("\/reset-password",\s*passwordResetSubmitLimiter,\s*resetPassword\)/);

  const middleware = await readFile(new URL("../middleware/aiRequestLimits.js", import.meta.url), "utf8");
  assert.match(middleware, /passwordResetRequestLimiter\s*=\s*createAiRateLimiter\(\{\s*limit:\s*5,\s*windowMs:\s*60\s*\*\s*60\s*\*\s*1000,\s*keyByAccount:\s*false/s);
  assert.match(middleware, /passwordResetSubmitLimiter\s*=\s*createAiRateLimiter\(\{\s*limit:\s*20,\s*windowMs:\s*60\s*\*\s*60\s*\*\s*1000,\s*keyByAccount:\s*false/s);
});

test("reset flow preserves generic request response and per-code attempt cap", async () => {
  const source = await readFile(new URL("../controllers/authController.js", import.meta.url), "utf8");
  assert.match(source, /const genericResponse = \{ success: true \}/);
  assert.match(source, /RESET_MAX_ATTEMPTS\s*=\s*5/);
  assert.match(source, /reset\.attempts >= RESET_MAX_ATTEMPTS/);
  assert.match(source, /!\/\^\\d\{6\}\$\/\.test\(code\)/);
});
