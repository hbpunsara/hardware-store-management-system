FROM node:20

WORKDIR /app

COPY Frontend ./Frontend
COPY electron ./electron

WORKDIR /app/Frontend
RUN npm install --legacy-peer-deps
RUN npm run build

WORKDIR /app/electron
RUN npm install

CMD ["npm", "start"]
