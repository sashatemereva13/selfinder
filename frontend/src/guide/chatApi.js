import { apiUrl } from "../api/baseUrl";

const AI_CONSENT_KEY = "sf_ai_processing_consent_grant";
const AI_CONSENT_VERSION = "2026-09-26";

export async function aiConsentHeaders() {
  let token = null;
  try { token = localStorage.getItem(AI_CONSENT_KEY); } catch {}
  if (!token) {
    const accepted = window.confirm(
      "When you use Guide or Measure, your words are sent to Groq, a third-party AI provider, to generate replies and readings. Continue?"
    );
    if (!accepted) throw new Error("AI consent declined");
    const response = await fetch(apiUrl("/ai-consent/grant"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accepted: true, version: AI_CONSENT_VERSION }),
    });
    if (!response.ok) throw new Error("Could not record AI processing consent");
    token = (await response.json()).token;
    localStorage.setItem(AI_CONSENT_KEY, token);
  }
  return { "X-AI-Consent": token };
}

export function clearAIConsentGrant() {
  try { localStorage.removeItem(AI_CONSENT_KEY); } catch {}
}

async function assertAIResponse(res) {
  if (res.ok) return;
  let code = null;
  try { code = (await res.clone().json()).code; } catch {}
  if (code === "AI_CONSENT_REQUIRED") clearAIConsentGrant();
  throw new Error("The request could not be completed.");
}

function authHeaders() {
  try {
    const raw = localStorage.getItem("sf_auth");
    const token = raw ? JSON.parse(raw).token : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function sendMessage(messages, philosopher, additionalContext = "") {
  const consentHeaders = await aiConsentHeaders();
  const systemPrompt = additionalContext
    ? `${philosopher.systemPrompt}\n\n${additionalContext}`
    : philosopher.systemPrompt;

  const res = await fetch(apiUrl("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(), ...consentHeaders },
    body: JSON.stringify({
      messages,
      systemPrompt,
    }),
  });
  await assertAIResponse(res);
  const { reply } = await res.json();
  return reply;
}

// Classify-and-branch turn used during the measure interview: tells the caller
// whether the person actually engaged with the question (advance the sphere)
// or asked/pushed back/deflected (stay on it, but still respond to what they said).
export async function sendMeasureExchange(philosopher, sphere, question, answer) {
  const consentHeaders = await aiConsentHeaders();
  const res = await fetch(apiUrl("/measure/exchange"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders(), ...consentHeaders },
    body: JSON.stringify({
      systemPrompt: philosopher.systemPrompt,
      sphere,
      question,
      answer,
    }),
  });
  await assertAIResponse(res);
  return res.json();
}

