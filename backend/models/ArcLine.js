import mongoose from "mongoose";
import { randomUUID } from "crypto";

// Your Arc's Cover page shows one philosopher-voiced line/question,
// generated from the person's own real record (see arcLineController.js's
// generation prompt for the exact content boundary — same "quote facts,
// never assert a pattern" discipline Crossing already follows). Cached
// once per calendar day per user+philosopher, not regenerated on every
// visit — dateKey (the server's own YYYY-MM-DD at generation time) is the
// idempotency key, mirroring how Crossing is keyed on wishId+
// measureResultId rather than generated fresh every time Your Arc opens.
const arcLineSchema = new mongoose.Schema({
  id: { type: String, default: () => randomUUID(), unique: true },
  userId: { type: String, required: true },
  philosopherId: { type: String, required: true },
  dateKey: { type: String, required: true },
  line: { type: String, required: true },
  createdAt: { type: String, required: true },
});

arcLineSchema.index({ userId: 1, philosopherId: 1, dateKey: 1 }, { unique: true });

export default mongoose.model("ArcLine", arcLineSchema);
