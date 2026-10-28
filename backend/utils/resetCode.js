import { randomInt } from "node:crypto";

// Six-digit decimal code; randomInt uses a cryptographically secure source
// and an exclusive upper bound, so every value from 100000 through 999999
// has an equal chance of being returned.
export function generateResetCode() {
  return String(randomInt(100_000, 1_000_000));
}
