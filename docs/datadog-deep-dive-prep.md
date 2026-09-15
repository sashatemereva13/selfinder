# Deep Dive prep — Selfinder, for the Datadog SWE Intern interview

Not a doc about the product — a doc about how to *talk about* the
product in Datadog's specific interview format. Their Deep Dive: one
project, walked through in granular detail — what you built, why that
tech choice, how you handled roadblocks, how it'd scale. They prefer
realistic scenarios over rehearsed answers, so this is source material
to speak from, not a script to recite. Every claim below points at a
real file/doc/commit — verify anything that feels stale before relying
on it live, the same discipline as the rest of this repo.

---

## The 60-second version, if asked "walk me through the project"

"Selfinder is a self-reflection app — mobile app, web frontend, and
backend — that I designed, built, and have been operating solo for
[fill in actual duration]. It's not a class project that stopped after
a demo — it's live, has real users, and I run the actual production
infrastructure: a VPS provisioned as Terraform, a Prometheus/Grafana/
Loki observability stack I built from scratch, CI/CD that gates every
deploy on tests and a health check, and an AI conversation layer on Groq
that routes between models per-locale and per-cost-profile. I want to
talk about [pick ONE thread below based on what the interviewer's team
does] because that's where the real engineering decisions were."

Then let the interviewer's own follow-up pick the thread — don't try to
cover all four below in the opening answer. Have all four ready.

---

## Thread 1: Infrastructure / observability (pick this if the team is platform/SRE-adjacent)

**What you built:** Terraform managing a real VPS via `terraform import`
(not from-scratch provisioning — deliberately, since importing existing
infra and getting `terraform plan` to show zero drift is a different,
often-skipped skill from greenfield IaC). Prometheus + Grafana + Loki +
Promtail, covering the whole box (multiple projects, not just this one),
with golden-signal alerting wired to Discord. CI/CD via GitHub Actions
that tests → builds a Docker image → pushes to GHCR → SSHes in → swaps
the container → runs a real health check that fails the deploy if the
new container doesn't come up healthy.

**Why this stack, if asked:** Hostinger VPS because it's what was
already paid for — the honest answer, not "I chose it for scalability."
Terraform over hand-managing the box because the actual failure mode
being solved was "if this box died, could anyone rebuild it" — and the
answer was no, before this. Prometheus/Grafana/Loki specifically (not a
SaaS observability tool) because — and this is worth saying straight to
a company that sells observability — understanding what Datadog's
product actually replaces meant building the primitives it abstracts
away: a scrape-based metrics model, PromQL, log-label cardinality,
alert-rule evaluation windows. Framed correctly, this reads as "I've
felt the pain your product exists to remove," not "I didn't use your
product."

**The incident to actually tell — Terraform state split-brain
(`terraform/README.md`, `docs/roadmap.md` Phase 1):** First version left
Terraform state purely local. CI's `apply` job had no record of a local
`terraform import`, so it planned to *create a second VPS* on push —
caught by Hostinger's API rejecting an invalid plan ID before anything
was actually provisioned. Root cause: local state only describes
infrastructure truthfully to whichever single machine holds the file;
once more than one runner (human laptop + CI) applies against the same
infra, state needs to live somewhere both can reach. Fixed by moving to
Terraform Cloud remote state. **Why this is a good story for Datadog
specifically:** it's a real, common, well-understood failure mode in
production Terraform usage — not a contrived bug — and the fix
generalizes ("shared mutable state needs a shared source of truth,"
which is also just... distributed systems).

**The second incident — the monitoring network race
(`docs/roadmap.md` Phase 2):** Deploy workflow updated to attach the
backend container to a new Docker network so Prometheus could reach it
by name — but the same push also triggered an immediate redeploy,
*before* that network existed on the VPS (it's only created the first
time the monitoring stack itself comes up). The deploy correctly
stopped the old container, then failed to start the new one — brief real
downtime. Root cause, stated precisely: **an implicit dependency the
deploy workflow assumed rather than one that was actually guaranteed** —
same shape of mistake as the Terraform incident (work correct in
isolation, wrong about what another system already has in place), found
independently, days apart. Naming that the two incidents *rhyme* is
itself a good answer to "how do you learn from failures" — you weren't
just fixing bugs, you noticed a pattern across two unrelated systems.

**A third instance of the exact same root-cause shape, a month later —
the MongoDB backup's network-access failure
(`docs/backup-strategy.md`, `docs/roadmap.md`):** a GitHub Actions
workflow was built to run `mongodump` against the production Atlas
cluster on a schedule. Every run failed with a TLS error
(`tls: internal error`) that looked, at first read, like a known Ubuntu
24.04/OpenSSL compatibility issue with Atlas — a real bug that does
exist for that combination in general, which made it a very plausible
first diagnosis. It wasn't the actual cause: Atlas's Network Access list
for this project only allows the VPS's fixed IP, and a GitHub-hosted
runner has no stable IP at all — Atlas was correctly rejecting an
untrusted connection, just surfacing that rejection as a generic TLS
alert rather than a clear access-denied message. The fix that was
available but *rejected*: open Atlas to all IPs (`0.0.0.0/0`) so the
runner could connect from anywhere — a real security tradeoff, made
just to let a cron job run, that wasn't worth it. The actual fix: run
the dump from the VPS itself (the one IP already trusted), and let
GitHub Actions only deploy the script and its cron entry to the box,
instead of running the dump directly. **This is worth telling as its
own story, not folded into the two above, specifically because of the
red herring**: the first, very reasonable hypothesis (an OpenSSL
version mismatch) was wrong, and the discipline that mattered was not
accepting the first plausible-sounding explanation without checking the
access-control layer too. It's also a genuinely good answer to "tell me
about a time you fixed the wrong thing first" — the honest version of
that question, where you catch your own wrong hypothesis before
shipping a bad fix, not after.

**"How would this scale" — answer honestly, don't oversell:** this is a
single VPS, no orchestrator, and that's a *stated, deliberate* decision
(`docs/roadmap.md` explicitly rejects adding Kubernetes here as
"resume-driven rather than solving a real problem — a distinction
interviewers tend to probe for directly"). If pushed on what would
actually break first at 100x traffic: the single-container blue/green-
less deploy (real downtime per deploy, not just a health-check gate) and
the in-process caches in `chatController.js` (a `Map`, not shared across
instances — the moment there's more than one backend instance, those
caches silently stop being effective, since each instance would have
its own copy with its own miss rate). Naming your own architecture's
real limits unprompted reads far better than waiting to be caught.

---

## Thread 2: AI/LLM integration (pick this if asked about Bits AI or the AI-tooling bullet in the JD)

Full technical detail: `docs/ai-routing-architecture.md` — read it
again right before the interview, it's dense.

**The one sentence that matters:** "I have two clearly separated tiers —
hardcoded narration for anything that doesn't need to be generative, and
live model calls for anything that's a genuine function of what the user
just said — and I moved a feature *from* the live tier back to hardcoded
after measuring that it regressed latency and voice consistency." That
last clause is the good part: most people can describe adding AI to a
feature; fewer can describe removing it after data showed it was wrong,
which is a stronger signal of engineering judgment than either choice
alone.

**The two-incidents-one-root-cause story (this is the best material in
the whole project for a "tell me about a bug" question):** Two different
LLM providers (Qwen and GPT-OSS, both hosted on Groq) both have hidden
reasoning tokens that silently ate the token budget meant for the
visible reply — same *conceptual* bug, but it manifested completely
differently per provider and required two separate diagnoses:

- Qwen: leaked a raw `<think>` block *into* the visible content field,
  breaking JSON parsing downstream.
- GPT-OSS: reasoning went to a *separate* field by default, but at
  default effort it burned the entire `max_tokens` budget on reasoning
  alone, returning **empty content with `finish_reason: "length"`** —
  a silent failure with no error, that quietly broke every Measure
  reading after a routine model swap.

**What to emphasize when telling this:** you didn't just patch the
symptom — for Qwen you specifically chose `reasoning_format: "hidden"`
over disabling reasoning outright, because you'd verified (by hand,
comparing outputs) that turning reasoning off measurably worsened the
actual reply quality. That's the difference between "made the error go
away" and "understood the tradeoff and picked correctly." If asked
"how would you generalize this," the honest answer is: a routing layer
across multiple model providers can't assume uniform behavior for the
same conceptual feature (here: hidden reasoning) — each provider's API
shape has to be verified against the real API, not assumed from
documentation, because both of these were confirmed live, not predicted.

**On model deprecation:** Groq removed `llama-3.3-70b-versatile`
without your involvement — you found out because production started
failing. Worth saying plainly: **you don't control your dependencies'
lifecycles, so your system's job is to fail loudly and be fixable in one
place when they change**, which is the actual argument for centralizing
model selection in `resolveModelParams` rather than inlining model
strings at every call site.

---

## Thread 3: Full-stack ownership (pick this if the interviewer seems to want breadth, not depth)

You own frontend (React/Vite web + React Native/Expo mobile), backend
(Express/Mongoose), infra (Terraform/Docker/GitHub Actions), and product
decisions (what a philosopher can and can't say, what a "reading" is)
end to end, alone. The honest framing for an intern-level Deep Dive:
**this is breadth without a team to divide it across**, which forces
you to make tradeoffs a specialized team member wouldn't have to think
about — e.g., you didn't over-invest in a scaling story the traffic
doesn't need yet (see the "not Kubernetes" call above), because as a
solo owner, time spent gold-plating one layer is time not spent on
whichever layer actually has the bug this week.

**A concrete cross-layer bug worth having ready:** `RULES.md`'s
engineering-conventions section documents that a client-only message
field (`suggestSpill`, used for local UI state) silently broke every
Guide conversation after exactly one reply, because Groq's API rejects
unknown properties on a message object sent back as conversation
history. This is a good "roadblock" story specifically because it's a
*contract mismatch between two layers you both own* — the fix
(stripping client-only fields before re-sending as history) is small,
but finding it required understanding both the mobile client's state
shape and the third-party API's validation behavior at once.

---

## Thread 4: The cardinality fix (pick this if the interviewer leans hard into "you'd be working on our actual product")

Small but sharp, and directly speaks Datadog's language: your own
`backend/metrics.js` had `req.path` (the literal URL) as a Prometheus
label fallback for any unmatched route. That's a real,
**attacker-influenced unbounded cardinality source** — anyone hitting
random/garbage paths creates a permanent new time series per distinct
path, forever. You found and fixed it (collapsed to one
`unmatched_route` label), and the important part to say out loud: **this
is the exact class of problem Datadog's own ingestion pipeline solves at
massive scale** (pre-aggregating high-cardinality tags before storage) —
you hit a tiny version of their core problem in your own side project.
This is a strong one-liner to have ready even if you lead with a
different thread, because it shows you did your homework on what the
company actually does, not just what the internship posting says.

---

## Questions they're likely to ask that aren't "tell me about the project"

- **"What would you do differently if you started over?"** Have a real
  answer, not a fake-humble non-answer. Candidates: (1) structured
  logging (pino) was added late — request/log correlation should have
  existed from day one, it would have made every incident above faster
  to diagnose; (2) the in-process caches and lack of any load-balancing
  story mean the backend can't horizontally scale today without a
  redesign — fine at current traffic, a real constraint if it grew.
- **"How do you know your system actually works — testing?"** Be honest
  about the real state: `backend/tests/` (plain `node --test`, no
  framework) covers server-config/CORS shape and the journey-line
  cleaner/cache-versioning guardrails specifically — narrow, targeted
  regression tests for behavior that already broke once, not broad
  business-logic coverage across the app. There's no load/chaos testing
  yet. Don't inflate this — an interviewer who's read the JD's "practical
  engineering" framing will respect an accurate gap assessment over a
  confident overclaim.
- **"Why MongoDB / why this stack generally?"** The documented, honest
  origin (`README.md`): Selfinder started as a university Generative AI
  & Chatbots assignment and grew into a real, live product from there —
  so some stack choices (MongoDB via Mongoose included) predate the
  "production system" phase and were never revisited once the system
  had real users and migrating would mean real risk. State it exactly
  that plainly rather than retrofitting a scalability justification that
  wasn't the actual reasoning — "it started as a class project, it
  stuck because rewriting a live system for architectural purity alone
  wasn't worth the risk" is a legitimate, honest engineering answer.
- **"Tell me about a time you disagreed with a design decision" /
  "roadblock you didn't solve cleanly."** The backup/DR gap is honest
  material here if it comes up naturally: MongoDB Atlas's free tier has
  *zero* backup capability, discovered only when actually checking
  (`docs/backup-strategy.md`) — a real, once-live risk in your own
  production system that you found and are still closing (the doc
  itself names the restore drill as not yet done). Using a currently-
  imperfect, honestly-labeled gap as your answer is stronger than
  pretending everything is finished.

---

## Tone notes for the interview itself

- **Lead with what you decided *not* to do, at least once.** Rejecting
  Kubernetes, rejecting `reasoning_effort: "none"`, keeping caches
  scoped to only the two call sites where caching is actually valid —
  each of these is a "I considered X and had a specific reason not to"
  moment, which reads as far more senior than listing technologies used.
- **Every incident story should have: symptom → root cause → fix →
  what it generalizes to.** Skipping the last step turns a good story
  into a debugging anecdote instead of an engineering one.
- **Don't pre-narrate more than the interviewer asks for.** Their format
  is described as going "in granular detail" on follow-ups they choose —
  answer the question asked, let them pull the next thread, rather than
  front-loading everything in this doc into one long opening monologue.
- **If a claim above turns out to be stale by interview day** (a
  constant renamed, a file moved, a number changed) — say what changed
  and why, don't awkwardly recite something no longer true. The real
  system evolving is a good sign, not a problem to hide.
