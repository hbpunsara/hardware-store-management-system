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

RUN apt-get update && apt-get install -y python3 python3-pip make g++ && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ml_service/requirements.txt ./ml_service/requirements.txt
RUN pip3 install --no-cache-dir -r ./ml_service/requirements.txt --break-system-packages || \
    pip3 install --no-cache-dir -r ./ml_service/requirements.txt


COPY --from=builder /app/dist ./dist

COPY backend/drizzle.config.ts backend/drizzle.config.pg.ts ./
COPY backend/shared ./shared
COPY backend/migrations-pg ./migrations-pg
COPY backend/ml_service ./ml_service

EXPOSE 5000

# Push schema to Postgres, seed if needed, train ML and start the server.
CMD sh -c 'npx drizzle-kit push || true; \
  node dist/seed.js || true; \
  npm run ml:train || true; \
  node dist/index.js'

