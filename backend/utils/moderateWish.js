import Groq from "groq-sdk";

// A narrowly-scoped classifier, architecturally separate from anything in
// the reflection/save path — this function's ONLY job is pass/fail plus a
// category. It never summarizes, paraphrases, or responds to a wish's
// content (see docs/session-result-concept.md's "no content-echoing, ever"
// rule) — its output is consumed only to decide save-or-redirect, never
// surfaced as text anywhere. Same groq.chat.completions.create pattern
// already used throughout chatController.js (e.g.
// requestRawInterviewScores's own "precise scoring system" prompt).
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODERATION_MODEL = "llama-3.1-8b-instant";

const SYSTEM_PROMPT = `You are a content classifier. You NEVER respond to, summarize, or
comment on the content you are given — you only classify it. Return
ONLY valid JSON, nothing else, in exactly this shape:
{"category":"ok"}
or
{"category":"concerning"}
or
{"category":"self-harm"}

Rules:
- "self-harm": the text expresses intent, desire, or a plan to harm or
  kill oneself, or expresses that the will to live is gone. Err toward
  this category when in doubt — a false positive here costs nothing but
  a gentle redirect; a false negative could miss something serious.
- "concerning": the text wishes harm on, or expresses a desire for
  control over, another real person — violence, revenge, coercion, or
  taking something from someone else. This is NOT for merely negative,
  sad, angry, or unhappy feelings about one's own life, which are
  "ok" — this is specifically about content that could harm or take
  from someone else, or targets a real person by name.
- "ok": everything else, including any wish about oneself, however sad,
  difficult, or ambitious it is. A person hoping to feel less alone,
  less afraid, more at peace, or wanting something to change in their
  own life is "ok", not "concerning".`;

// Returns { category: 'ok' | 'concerning' | 'self-harm' }. Fails CLOSED —
// if the classifier call itself errors, treat the wish as "concerning"
// (blocked, retry offered) rather than silently letting unclassified text
// through unsaved-content moderation. This is deliberately more
// conservative than the rest of this app's usual "best-effort, fail open"
// discipline (e.g. saveMeasureResultIfConsented) specifically because
// this is the one safety-relevant check in the whole wish flow.
export async function moderateWish(text) {
  try {
    const response = await groq.chat.completions.create({
      model: MODERATION_MODEL,
      max_tokens: 40,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: text },
      ],
    });

    const raw = response.choices[0].message.content.trim();
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error(`No JSON object found in moderation response: ${raw}`);
    }
    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    if (!["ok", "concerning", "self-harm"].includes(parsed.category)) {
      throw new Error(`Unexpected moderation category: ${parsed.category}`);
    }
    return { category: parsed.category };
  } catch (err) {
    console.error("Wish moderation failed, failing closed:", err.message);
    return { category: "concerning" };
  }
}
