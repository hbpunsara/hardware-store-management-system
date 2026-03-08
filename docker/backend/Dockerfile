# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json ./
RUN npm install

COPY backend/ ./
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

COPY backend/drizzle.config.ts backend/drizzle.config.pg.ts ./
COPY backend/shared ./shared
COPY backend/migrations-pg ./migrations-pg

EXPOSE 5000

# We need to install drizzle-kit for the push command
CMD npx drizzle-kit push --config=drizzle.config.pg.ts && node dist/index.js
