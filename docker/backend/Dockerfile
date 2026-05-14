# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# Production stage
FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies including libpq-dev for psycopg2
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy ML requirements and install
COPY backend/ml_service/requirements.txt ./ml_service/requirements.txt
RUN pip3 install --no-cache-dir -r ./ml_service/requirements.txt --break-system-packages || \
    pip3 install --no-cache-dir -r ./ml_service/requirements.txt

# Copy built assets and necessary files
COPY --from=builder /app/dist ./dist
COPY backend/drizzle.config.ts backend/drizzle.config.pg.ts ./
COPY backend/shared ./shared
COPY backend/migrations-pg ./migrations-pg
COPY backend/ml_service ./ml_service

EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Push schema, seed, train ML (if first run), and start
CMD ["sh", "-c", "npx drizzle-kit push || true && node dist/seed.js || true && npm run ml:train || true && node dist/index.js"]

