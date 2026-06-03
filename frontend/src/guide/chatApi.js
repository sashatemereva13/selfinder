// Replace `sendMessage` with a real API call when ready.
// The signature stays identical — the rest of the app does not need to change.
//
// Real Claude API example:
//   const res = await fetch('/api/chat', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({ messages, systemPrompt: philosopher.systemPrompt }),
//   });
//   const { reply } = await res.json();
//   return reply;

const MOCK_RESPONSES = {
  socrates: [
    "That is a curious place to begin. But before we continue — who told you that was the problem? And did you ever examine whether you agree?",
    "I wonder. When you say you know what you should do, what do you mean by 'should'? Whose voice is that?",
    "Interesting. But what if the discomfort you are describing is not the obstacle — what if it is pointing toward something you have been avoiding examining?",
    "You say you feel stuck. But in my experience, when we feel stuck, we are usually standing very close to a belief we have never questioned. What is the belief beneath this?",
    "What would it mean if you were wrong about that? Not wrong in a way that hurts you — but wrong in a way that frees you?",
    "I notice you describe this as something that happens to you. But I am curious — where is the one who chooses in all of this?",
  ],
  stoics: [
    "There are two territories here. One belongs to you — your judgments, your intentions, your response. One does not. Let us start by drawing that line clearly. Which of these troubles you because it belongs to the first territory?",
    "Marcus once wrote: 'You have power over your mind, not outside events. Realize this, and you will find strength.' What is the one thing in this situation that is genuinely within your power right now?",
    "The weight you are carrying — how much of it is circumstance, and how much of it is the story you are building around circumstance? These are not the same thing.",
    "Seneca understood that most of what we suffer, we suffer in anticipation. What is actually happening right now, in this moment, without the projected future?",
    "There is grief in what you are describing, and that is real. But there is also a question worth sitting with: what does this situation ask of your character? That part is yours to shape.",
    "Epictetus was enslaved. He could not change that. What he could change was the orientation of his inner life. I do not say this to diminish your difficulty — I say it to point toward where the ground actually is.",
  ],
  kierkegaard: [
    "What you are describing sounds like the anxiety that comes before a real choice. Not a trivial one — a choice that would make you into something. That kind of anxiety is not a malfunction. It is the price of being free.",
    "I wonder if the difficulty is not between two options, but between who you have been and who you are being asked to become. That is a different kind of choice entirely.",
    "There is something you are not saying. Not because you are hiding it — but because you have not yet found the language for it. What is the thing beneath the thing?",
    "The leap is not something you can reason your way into. At some point, the thinking has to stop and something else has to carry you. What would it mean to trust that?",
    "You are describing the search for feeling, for resonance, for the experience that proves something. But what if the question is not 'what feels right' but 'who am I becoming through this choice'?",
    "Every genuine either/or contains a self that is at stake. That is why it is so difficult. The self that chooses will not be the same self afterward. Does that frighten you, or does part of you recognize it as necessary?",
  ],
  camus: [
    "You are looking for the meaning that will finally make all of this make sense. I understand. But what if the search itself is the wrong frame? What if the question is not what does this mean, but what do I make of it?",
    "The absurd is not a problem to be solved. It is the gap between the human need for clarity and the world's silence on the matter. You can live inside that gap — and many people do, beautifully.",
    "There is something brave in what you are sitting with. Most people run from it. They fill the silence with noise, with busyness, with borrowed certainties. You are here, in the silence. That matters.",
    "Sisyphus had no guarantee that the rock would stay at the top. He pushed it anyway. Not because he was foolish — but because the pushing was the only life available to him, and he chose to be fully alive inside it.",
    "Loss that reorganizes your world is a particular kind of difficulty. It is not just pain — it is disorientation. The map is gone. You are not lost because you are failing. You are lost because the territory changed.",
    "What you call meaninglessness, I would call the moment before you begin to create meaning yourself. The world will not hand it to you. But you are more capable of building it than you know.",
  ],
  aristotle: [
    "You have been reflecting for some time — that is valuable. But at some point, reflection must become action, or it circles back on itself. What is the smallest concrete step available to you today?",
    "Character is not what we intend. It is what we repeatedly do. Looking at your days — what kind of person are your daily choices actually building, regardless of who you intend to be?",
    "I want to understand the situation more fully before I say anything useful. Tell me: in your relationships, your work, your daily rhythms — where do you feel most like yourself?",
    "Virtue is a habit, not a decision. We do not become courageous by deciding to be courageous once. We become courageous by practicing small acts of courage until they belong to us. What has that looked like in your life recently?",
    "The good life, as I understood it, is not a destination. It is a way of moving through the days — with attention, with care, with the kind of effort that expresses who you genuinely are. Does your life currently have that quality?",
    "There is a difference between a problem to be solved and a condition to be managed wisely. Which is this, do you think? And does knowing that change how you approach it?",
  ],
};

export async function sendMessage(messages, philosopher) {
  await new Promise(r => setTimeout(r, 1100 + Math.random() * 900));

  const pool = MOCK_RESPONSES[philosopher.id] ?? MOCK_RESPONSES.socrates;
  const assistantCount = messages.filter(m => m.role === 'assistant').length;
  return pool[assistantCount % pool.length];
}
