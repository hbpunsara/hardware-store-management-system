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

EXPOSE 5000

CMD ["node", "dist/index.js"]
