import { apiUrl } from "../api/baseUrl";

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
  const systemPrompt = additionalContext
    ? `${philosopher.systemPrompt}\n\n${additionalContext}`
    : philosopher.systemPrompt;

  const res = await fetch(apiUrl("/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      messages,
      systemPrompt,
    }),
  });
  const { reply } = await res.json();
  return reply;
}

// Classify-and-branch turn used during the measure interview: tells the caller
// whether the person actually engaged with the question (advance the sphere)
// or asked/pushed back/deflected (stay on it, but still respond to what they said).
export async function sendMeasureExchange(philosopher, sphere, question, answer) {
  const res = await fetch(apiUrl("/measure/exchange"), {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      systemPrompt: philosopher.systemPrompt,
      sphere,
      question,
      answer,
    }),
  });
  return res.json();
}

