# AI conversation routing — design and the failures that shaped it

This documents the actual engineering behind `backend/controllers/
chatController.js` and its siblings (`journeyController.js`,
`crossingController.js`, `arcLineController.js`): how a request picks a
model, why the split between hardcoded and AI-generated text exists, and
three separate production failures (one caught before ship, two live)
that each changed the design. Written up as its own doc because the
reasoning is real systems-design material — model lifecycle handling,
per-provider output quirks, locale-based routing, cost/latency tradeoffs
— not because the code needed more comments. See `RULES.md` for the
product-level rule this architecture exists to serve (a philosopher's
voice must never flatten toward a generic assistant) and
`docs/roadmap.md` for the dated history this doc summarizes.

## The one architectural decision everything else follows from

**Two clearly separated tiers, not one AI layer that does everything:**

1. **Hardcoded narration** — transition beats, ambient copy, the
   philosopher's opening greeting. Authored once, in character, and
   never touches a model at request time. Zero latency, zero variance,
   zero API cost.
2. **Live AI conversation** — Guide's back-and-forth, Measure's
   interview, Journey exchanges. Genuinely generative and responsive,
   because the whole product value here is a real exchange, not a script.

This was **tried the other way and reverted**: ambient/badge commentary
was briefly generated live, and it measurably regressed — added latency
on every screen transition, and drifted from each philosopher's authored
voice over repeated calls (see `RULES.md`, "Content / voice"). The
lesson generalizes past this one app: **the question isn't "can this be
AI-generated," it's "does generativity pay for itself at this call
site."** A greeting the user will see identically every time doesn't
need an LLM in the loop; a conversation that has to actually respond to
what a specific person just said does. Getting this boundary right up
front is most of why the system below stays cheap and fast at the tiers
that don't need to be smart, while staying real at the ones that do.

## Model selection: `resolveModelParams(locale, fallbackModel, fallbackMaxTokens)`

Most live-AI call sites funnel through one function
(`chatController.js:108`) that decides three things per request: which
model, what `max_tokens`, and what provider-specific params. The English
path and the Russian path are handled as genuinely different routing
rules, not the same call with a translated prompt bolted on.

One call site, `requestRawInterviewScores` (Measure's raw scoring pass),
deliberately bypasses this and hardcodes `models[0]` directly — pure
numeric scoring produces no user-facing text at all, so there is nothing
for a locale to change; running it through the shared routing function
would add a branch that can never actually take the Russian path,
purely for the sake of using one function everywhere. Worth naming
explicitly: not every call site should be forced through a shared
abstraction just because most of them fit it.

- **English locale** → whichever Groq-hosted model
  (`openai/gpt-oss-120b` for the heavier call sites, `-20b` for lighter
  ones) that call site is tuned for, at that call site's own
  `max_tokens` budget.
- **Russian locale** → routed to a *different model entirely*,
  `qwen/qwen3.6-27b`, not the same model with a "reply in Russian"
  instruction appended. This was a deliberate choice, not a shortcut:
  Qwen is trained for materially stronger non-English performance than
  the Llama/GPT-OSS family this app otherwise runs, so a locale switch
  is a **model-routing decision**, not just a prompt-content decision.
  The `RUSSIAN_REPLY_INSTRUCTION` appended to the system prompt (see
  below) still matters even with the right model, because every
  authored system prompt in this codebase — `UNIVERSAL_RULES`, all five
  philosophers' personas, the badge/journey-line prompts — is written in
  English and stays that way; only the *output* language changes per
  request, not the source of truth.

This is the shape of a much larger pattern in real systems: pick the
right backend per request based on a routing key (here, locale; at
Datadog's scale this is the same idea behind routing a metric to the
right shard by `organization_id` and metric name) rather than trying to
make one backend serve every case adequately.

## Why per-model params exist at all: two provider-specific failures, found live

Two real incidents in this file are the actual reason
`resolveModelParams` looks the way it does — both are cases where the
same *conceptual* problem (a model's hidden reasoning silently eating
the token budget meant for the visible reply) manifested completely
differently per provider, and neither was discoverable without hitting
the real API:

**Qwen3.6 leaks its reasoning trace into the visible output by
default.** Unconfigured, every Qwen reply on Groq comes back with a raw
`<think>...</think>` block prepended to `message.content`. This breaks
two things simultaneously: the person sees the model's internal
monologue instead of the philosopher's reply, and every call site that
parses the reply as JSON (`postChat`, `postMeasureExchange`) throws on
invalid JSON, since the leaked block isn't valid JSON. Fixed with
`reasoning_format: "hidden"` — deliberately *not*
`reasoning_effort: "none"`, because disabling reasoning outright
measurably changed the *quality* of the philosopher's reply (worse tone,
worse handling of subtext), confirmed by manual comparison. The fix
needed to hide the trace without turning off the thinking that produces
a better answer — a real quality/observability tradeoff, not a purely
mechanical bug fix.

Reasoning tokens still count against `max_tokens`, and the amount is
*non-deterministic per request* — measured between 1043 and 2460
reasoning tokens across identical calls to the same prompt. A
`max_tokens` sized only for the visible reply's expected length silently
truncates it mid-sentence once a given request's reasoning happens to
run long (`max_tokens: 1200` cut a reply off mid-word and broke JSON
parsing in testing). `QWEN_REASONING_TOKEN_HEADROOM = 2800` is added
*on top of* each call site's own reply-length budget rather than
replacing it, specifically so raising a call site's reply-length budget
later doesn't also require remembering to re-tune this unrelated
constant — two independent knobs, not one conflated one.

**`gpt-oss-120b`/`-20b` have the opposite integration shape for the same
underlying problem.** Unlike Qwen, GPT-OSS's hidden reasoning is
returned in a *separate* response field by default, not prepended to
content — so none of Qwen's `reasoning_format`/token-headroom handling
applies here at all. But left at its default `reasoning_effort`
("medium"), GPT-OSS still burned an entire small `max_tokens` budget
(90–400 tokens across this file's call sites) purely on hidden
reasoning, returning **empty visible content with
`finish_reason: "length"`** on every call — confirmed live 2026-08-17,
and this silently broke every Measure reading and Crossing reflection
after a model swap, until root-caused. `reasoning_effort: "low"` cut
that down substantially but was *not* sufficient alone against this
file's longer prompts (the scoring prompt, with the full vibration-scale
reference table embedded, still hit `finish_reason: "length"` 10/10
times at `max_tokens: 400` even at "low" effort) — the actual fix was
raising each call site's own `max_tokens`, with "low" effort as a
necessary but not sufficient companion change.

**The generalizable lesson, worth stating explicitly in an interview:**
"hidden reasoning eating the output budget" is one conceptual failure
mode, but it does not have one fix — it has as many fixes as there are
providers with different API shapes for exposing (or not exposing) that
reasoning. A routing layer that assumes uniform behavior across
providers will break silently, per-provider, the moment a new one is
added — which is exactly what happened here twice, on two different
providers, requiring two different diagnoses and two different fixes.

## Model deprecation is a routing-layer concern, not a one-time fix

`models[0]` (`llama-3.3-70b-versatile`) was unilaterally decommissioned
by Groq on 2026-08-16 with no code change on this side — the first
symptom was Measure readings failing. The replacement, confirmed via
`groq.models.list()` rather than assumed from a changelog, was
`openai/gpt-oss-120b` (which is what triggered the reasoning-budget
incident above). Separately, `models[1]`
(`llama-3.1-8b-instant`) and an already-unused `mixtral-8x7b-32768` were
found to have *also* been removed at some earlier, undated point —
discovered only because Guide (`postChat`, which used `models[1]`) kept
failing live even after the first fix, while Measure (`models[0]`)
worked. Two upstream deprecations, discovered at two different times,
via two different symptoms, on the same file. The unused `mixtral`
constant was dropped rather than replaced, since no call site actually
referenced it — a reminder to check real usage before assuming a
"replace the model" fix needs a 1:1 substitution everywhere a name
appears.

**This is the argument for centralizing model selection in one function
rather than inlining model strings at each call site**: when Groq changes
its model catalog again (an external dependency this app doesn't
control and can't schedule around), there is exactly one place to look,
not N call sites to grep for and each individually re-verify.

## Cost/latency control: response caching, not smarter prompting

Two of the four call sites in `chatController.js` — badge comments and
journey-lines — cache the model's output for **12 hours**
(`BADGE_COMMENT_CACHE_TTL_MS`, `JOURNEY_LINE_CACHE_TTL_MS`, both an
in-process `Map` keyed by `JSON.stringify` of the request's structured
context — philosopher id, page path, label/description/themes — not a
hash, so the key is human-readable in a debugger at the cost of being
longer than a hash would be). This is a deliberate scope
decision: these two surfaces are *ambient* commentary (a badge tooltip,
a journey-card subtitle) where the same underlying state — a comment
about the same measurement result, in the same voice — recurs across
many page loads from the same or different users, and doesn't need a
fresh generation every time to still feel alive. Guide and Measure's
actual conversation, by contrast, are never cached — each reply is a
genuine function of what the person just said, so caching would either
be a cache-key explosion (effectively caching nothing, since almost
every input is unique) or would silently make the "conversation" static,
which defeats the point.

`JOURNEY_LINE_CACHE_VERSION = 2` — a version bump baked into the cache
key — exists so a future prompt-format change can invalidate every
previously-cached line without needing to flush the whole `Map` or
reason about TTL timing; changing the prompt template and forgetting to
bump this constant is the realistic failure mode to watch for if this
cache is ever touched again.

**Post-processing is a real layer, not an afterthought.**
`cleanBadgeComment`/`cleanJourneyLine`/`cleanSpillMetaCommentary` strip
model self-narration the prompt explicitly asked it not to produce (a
model announcing "(No suggestion of Spill)" inline instead of using the
requested structured JSON field, or prefacing a rewritten line with
"Here's a rewritten version..."). This exists because **instructing a
model not to do something in the prompt does not reliably stop it from
doing it** — the system still needs a defensive layer downstream of
generation, the same way input validation exists even when the client
is "supposed to" send well-formed data.

## Retry policy is intentionally shallow, and locale-blind

`postMeasureInterview`'s scoring call retries at most twice
(`MAX_ATTEMPTS = 2`) before failing the request outright with a 500 —
no exponential backoff, no jitter, no silent fallback to a stale or
default score. This is a deliberate choice for a *user-visible synchronous
request*: a person is waiting on this specific response to see their
reading, so masking a failure behind a guessed/default score would be
actively dishonest about what actually happened, worse than a visible
error the client can retry. A background or batch job would warrant a
very different retry policy (backoff, more attempts, dead-letter
queuing); this one deliberately doesn't try to be that.

## What this doc is not claiming

This is a single-process, single-provider (Groq, hosting multiple
model families) routing layer serving real but modest traffic — not a
distributed request router, and nothing here queues, load-balances
across providers, or shards by tenant. Framed honestly: the *shape* of
the problem (route a request to the right backend based on a key,
handle backend-specific quirks in one centralized place, survive an
upstream provider changing its catalog without warning, control cost via
caching at the call sites where it's actually valid) is the same shape
that shows up at every scale, including inside a metrics/logs ingestion
pipeline routing by `organization_id` — but the actual mechanisms here
(an in-process `Map`, two sequential retry attempts, no backoff) are
sized for this app's real traffic, not artificially inflated to look
more impressive than they are.
