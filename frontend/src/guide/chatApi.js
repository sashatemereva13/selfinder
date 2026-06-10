function authHeaders() {
  try {
    const raw = localStorage.getItem("sf_auth");
    const token = raw ? JSON.parse(raw).token : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function sendMessage(messages, philosopher) {
  const res = await fetch("http://localhost:3001/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({
      messages,
      systemPrompt: philosopher.systemPrompt,
    }),
  });
  const { reply } = await res.json();
  return reply;
}


