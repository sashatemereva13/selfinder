FROM node:20-alpine

WORKDIR /app

# Build context is the repo root (see .github/workflows/deploy-backend.yml
# — context: ., file: ./backend/Dockerfile), not backend/ alone. backend/
# imports shared/ via relative paths ("../../shared/*.mjs" — see
# shared/package.json's own description of why: it's a real cross-runtime
# npm package, not vendored duplicate copies), so the container needs
# shared/ to exist one level above backend/'s own files at the exact same
# relative depth the source imports expect.
COPY backend/package*.json ./
RUN npm ci --omit=dev

COPY backend/ .
COPY shared/ ../shared/

ENV NODE_ENV=production
ENV PORT=3001

# EXPOSE is documentation only — the real listener is whatever PORT is at
# runtime (production sets it to 3002, see deploy-backend.yml).
EXPOSE 3001

# The app never writes to disk (logs go to stdout), so the root-owned files
# above only need to be readable — no reason to run the process as root.
USER node

# Probe with node, not curl/wget: it's the one executable this image is
# guaranteed to have. /api/health answers 503 while MongoDB is disconnected.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+process.env.PORT+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.js"]
