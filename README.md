# Selfinder

A 3D self-reflection experience: choose a philosopher (Socrates, Marcus Aurelius, Kierkegaard, Camus, or Aristotle), measure where you currently stand across four dimensions of your inner state, read what that actually means, and tune into it through sound — narrated in the philosopher's voice the whole way through.

Built by Aleksandra Temereva, originally for a university Generative AI & Chatbots assignment, now operated by **AURELIU XIII DIGITAL EXPERIENCE** (registered in Dubai, UAE) for real users beyond that assignment. See [`collaboration-log.md`](./collaboration-log.md) for the full development history and the decisions behind it.

## How it's built

**Frontend** — React 19 + Vite, [react-three-fiber](https://github.com/pmndrs/react-three-fiber)/drei for the 3D scenes, React Router for navigation, Framer Motion for transitions.

**Backend** — Node + Express 5, MongoDB (via Mongoose) for persistence, JWT for sessions, bcrypt for password hashing, [Groq](https://groq.com) (Llama 3.1 8B Instant) for live AI conversation.

Each philosopher carries a full hand-written system prompt (their method, tone, and what they refuse to do) — only the live back-and-forth conversation is AI-generated. Narration at every other transition point (entering, completing the measurement, reading your results, tuning in) is static, hand-authored text per philosopher, kept deliberately separate from the AI so it never drifts in voice or adds latency.

## Project structure

```
frontend/   React app (Vite) — the 3D experience, the measurement flow, the levels, tune-in
backend/    Express API — auth, chat, measurement results, conversation storage, GDPR endpoints
```

## Running it locally

Requires Node 20+ and a MongoDB connection string (a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster works fine for local dev).

```bash
# backend
cd backend
npm install
cp .env.example .env   # fill in the values below
npm run dev             # http://localhost:3001

# frontend, in a second terminal
cd frontend
npm install
npm run dev             # http://localhost:5173
```

### Backend environment variables (`backend/.env`)

| Variable             | Required | Purpose                                                              |
| --------------------- | -------- | --------------------------------------------------------------------- |
| `MONGODB_URI`         | yes      | MongoDB connection string. The server refuses to start without it.   |
| `JWT_SECRET`          | yes      | Signs session tokens.                                                |
| `GROQ_API_KEY`        | yes      | Powers live philosopher conversation.                                |
| `ADMIN_SIGNUP_CODE`   | no       | If set, registering with this code as `adminCode` creates an admin account. |
| `CLIENT_ORIGIN`       | no       | Comma-separated extra origins to allow through CORS, beyond localhost. |
| `PORT`                | no       | Defaults to `3001`.                                                  |

### Frontend environment variables (`frontend/.env`)

| Variable              | Required | Purpose                                                          |
| --------------------- | -------- | ----------------------------------------------------------------- |
| `VITE_API_BASE_URL`   | no       | Overrides the backend base URL. Defaults to `http://<host>:3001/api` in dev, `/api` in production (expects the backend reverse-proxied under the same domain). |

## Testing

```bash
cd backend && npm test
cd frontend && npm test
```

## Deployment

Both apps deploy automatically via GitHub Actions on every push to `main`:

- **Frontend** (`.github/workflows/deploy-frontend.yml`) — builds the Vite app and rsyncs the static output to the VPS, served by nginx.
- **Backend** (`.github/workflows/deploy-backend.yml`) — runs backend tests, builds a Docker image, pushes it to GHCR, then SSHes into the VPS to replace the running `selfinder-backend` container. The container reads its config from a standing `.env` file on the VPS (not from GitHub Secrets) — see the env var table above for what needs to be in it.

If backend tests fail, or the new container fails its post-deploy health check (`/api/health`), the deploy stops there rather than leaving a broken container running.

## Data & privacy

Selfinder treats conversations as sensitive personal data: they're never stored server-side unless you're signed in **and** have separately granted explicit consent, and withdrawing that consent deletes them immediately. Full GDPR-style rights (export, erasure, consent history) are built into the account flow under "Your Space." The in-app Privacy Policy (reachable from the registration screen) has the complete, current detail.
