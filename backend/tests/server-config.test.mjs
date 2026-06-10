import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const serverPath = resolve("server.js");
const serverFile = readFileSync(serverPath, "utf8");

test("backend server reads port from environment with a local fallback", () => {
  assert.match(serverFile, /process\.env\.PORT\s*\|\|\s*3001/);
  assert.match(serverFile, /app\.listen\(port,/);
});

test("backend server reads configured origins from environment", () => {
  assert.match(serverFile, /process\.env\.CLIENT_ORIGIN/);
  assert.match(serverFile, /split\(","\)/);
});

test("backend server allows local development origins and validates others through CORS", () => {
  assert.match(serverFile, /http:\/\/localhost:5173/);
  assert.match(serverFile, /http:\/\/127\.0\.0\.1:5173/);
  assert.match(serverFile, /allowedOrigins\.has\(origin\)/);
  assert.match(serverFile, /not allowed by CORS/);
});

test("backend server exposes the health route for deploy smoke checks", () => {
  assert.match(serverFile, /app\.use\("\/api\/health"/);
});
