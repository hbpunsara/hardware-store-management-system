# Build stage - use slim (Debian) so build tools are available quickly
FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY backend/drizzle.config.ts backend/drizzle.config.pg.ts ./
COPY backend/shared ./shared
COPY backend/migrations-pg ./migrations-pg
COPY backend/ml_service ./ml_service

EXPOSE 5000

# Push SQLite schema (always, for offline use), then try Postgres schema push.
# Seed both databases and start the server.
CMD sh -c 'npx drizzle-kit push --config=drizzle.config.ts || true; \
  if [ -n "$DATABASE_URL" ]; then npx drizzle-kit push --config=drizzle.config.pg.ts || true; fi; \
  node dist/seed.js || true; \
  node dist/index.js'
