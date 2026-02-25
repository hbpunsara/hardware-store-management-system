# Docker setup

## Frontend & Backend (API only)

```bash
# From project root
docker compose up -d
```

- **Frontend:** http://localhost (port 80) — nginx serves the app and proxies `/api` to the backend
- **Backend:** http://localhost:5000 — API only

## Full stack (with Postgres)

```bash
docker compose -f docker-compose.full.yml up -d
```

- **Frontend:** http://localhost
- **Backend:** http://localhost:5000
- **Postgres:** localhost:5432 (user `postgres`, password `postgres`, db `hardware_db`)
- **Adminer:** http://localhost:8080 (DB UI)

## Build only

```bash
docker compose build
# or
docker compose -f docker-compose.full.yml build
```

## Notes

- Frontend image uses the `Frontend` folder (capital F). If your folder is `frontend`, edit `docker/frontend/Dockerfile` and change `COPY Frontend/` to `COPY frontend/`.
- Backend expects `PORT=5000`; set `DATABASE_URL` when using Postgres (see `docker-compose.full.yml`).
