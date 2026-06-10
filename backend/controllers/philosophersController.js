import { PHILOSOPHERS } from "../data/philosophers.js";

export function getPhilosophers(req, res) {
  res.json(PHILOSOPHERS);
}
