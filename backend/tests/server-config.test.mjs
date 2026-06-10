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

test("backend server reads client origin from environment with a local fallback", () => {
  assert.match(serverFile, /process\.env\.CLIENT_ORIGIN\s*\|\|\s*"http:\/\/localhost:5173"/);
  assert.match(serverFile, /cors\(\{\s*origin:\s*clientOrigin\s*\}\)/);
});

test("backend server exposes the health route for deploy smoke checks", () => {
  assert.match(serverFile, /app\.use\("\/api\/health"/);
});
