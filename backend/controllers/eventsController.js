import Event from "../models/Event.js";
import { prepareEventBatch } from "../utils/eventValidation.js";

export async function postEvents(req, res) {
  const prepared = prepareEventBatch(req.body ?? {});
  if (prepared.error) return res.status(400).json({ error: prepared.error });

  try {
    await Event.insertMany(prepared.docs);
    res.json({ received: prepared.docs.length });
  } catch (err) {
    req.log.error({ err }, "Failed to save events");
    res.status(500).json({ error: "Failed to save events" });
  }
}
