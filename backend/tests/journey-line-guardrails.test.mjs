import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const controllerPath = resolve("controllers/chatController.js");
const controllerFile = readFileSync(controllerPath, "utf8");

test("journey-line prompt requires line-only output with no meta preface", () => {
  assert.match(
    controllerFile,
    /return only the final rewritten line\(s\)/,
    "Journey-line prompt should explicitly require line-only output",
  );

  assert.match(
    controllerFile,
    /do not preface with phrases like/,
    "Journey-line prompt should explicitly forbid meta-preface phrasing",
  );

  assert.match(
    controllerFile,
    /do not explain what you changed/,
    "Journey-line prompt should forbid explanatory meta text",
  );
});

test("journey-line cleaner strips obvious rewrite-preface phrasing", () => {
  assert.match(
    controllerFile,
    /rewritten version/,
    "Journey-line cleaner should guard against 'rewritten version' prefacing",
  );

  assert.match(
    controllerFile,
    /Here\\'s a rewritten version/,
    "Prompt should guard against the exact 'Here's a rewritten version' phrasing",
  );

  assert.match(
    controllerFile,
    /marcus aurelius\|kierkegaard\|camus\|aristotle/,
    "Journey-line cleaner should strip philosopher-name meta prefacing",
  );
});

test("journey-line cache key is versioned to avoid replaying stale bad lines", () => {
  assert.match(
    controllerFile,
    /JOURNEY_LINE_CACHE_VERSION\s*=\s*2/,
    "Journey-line cache should be versioned",
  );

  assert.match(
    controllerFile,
    /version:\s*JOURNEY_LINE_CACHE_VERSION/,
    "Journey-line cache key should include the cache version",
  );
});
