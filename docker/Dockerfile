FROM node:20

WORKDIR /app

# Install missing GUI dependencies for Electron to run in Linux container
RUN apt-get update && apt-get install -y \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcb-dri3-0 \
    libxtst6 \
    libdrm2 \
    libgbm1 \
    libxshmfence1 \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

COPY Frontend ./Frontend
COPY electron ./electron

WORKDIR /app/Frontend
RUN npm install --legacy-peer-deps
RUN npm run build

WORKDIR /app/electron
RUN npm install --network-timeout=1000000

CMD ["xvfb-run", "-a", "npm", "start", "--", "--no-sandbox", "--disable-gpu"]
