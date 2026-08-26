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

EXPOSE 3001

CMD ["node", "server.js"]
