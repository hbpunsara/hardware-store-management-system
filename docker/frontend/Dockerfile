# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY Frontend/package.json Frontend/package-lock.json ./
RUN npm install --legacy-peer-deps

COPY Frontend/ ./
RUN npm run build

# Production stage: nginx serves static files and proxies /api to backend
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

COPY docker/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
