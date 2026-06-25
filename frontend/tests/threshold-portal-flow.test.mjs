import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const experienceFile = readFileSync(resolve("src/frontpage/Experience.jsx"), "utf8");
const magicBallFile = readFileSync(resolve("src/designElements/MagicBall.jsx"), "utf8");
const wizardMessageFile = readFileSync(resolve("src/frontpage/WizardMessage.jsx"), "utf8");

test("Experience drives threshold with explicit portal-sequence phases", () => {
  assert.match(
    experienceFile,
    /setThresholdPhase\("message_open"\)/,
    "Threshold should enter message_open after the first ball activation",
  );

  assert.match(
    experienceFile,
    /setThresholdPhase\("portal_summon"\)/,
    "Threshold should summon the portal after the message closes",
  );

  assert.match(
    experienceFile,
    /"ball_consuming"/,
    "Threshold should animate the ball being consumed",
  );

  assert.match(
    experienceFile,
    /"portal_ready"/,
    "Threshold should expose a portal_ready phase before the jump",
  );

  assert.match(
    experienceFile,
    /setThresholdPhase\("jumping"\)/,
    "Threshold should move into a jumping phase when the portal is activated",
  );
});

test("MagicBall no longer asks for a second sphere trigger", () => {
  assert.doesNotMatch(
    magicBallFile,
    /Touch the sphere again to enter the psyche\./,
    "MagicBall should not keep the old second-click copy",
  );

  assert.doesNotMatch(
    magicBallFile,
    /flyToSelfinder/,
    "MagicBall should not run the old Selfinder camera flight",
  );
});

test("WizardMessage trims threshold conversation flow down to jump support", () => {
  assert.doesNotMatch(
    wizardMessageFile,
    /ConversationMap/,
    "Threshold jump controller should not import the old conversation map",
  );

  assert.doesNotMatch(
    wizardMessageFile,
    /portalPromptShell|portalJumpButton/,
    "Threshold jump controller should not render the old portal prompt shell or CTA button",
  );

  assert.match(
    wizardMessageFile,
    /portalJumpHint/,
    "Threshold jump controller should render the new minimal portal affordance",
  );
});
