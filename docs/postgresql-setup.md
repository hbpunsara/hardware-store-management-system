# PostgreSQL setup

The backend uses **Drizzle ORM** and expects a **PostgreSQL** database. Set `DATABASE_URL` and run migrations to create tables.

---

## Option 1: Docker (recommended)

### Start Postgres only

```bash
# From project root
docker compose -f docker-compose.pg.yml up -d
```

- **PostgreSQL:** `localhost:5432`  
  - User: `postgres`  
  - Password: `postgres`  
  - Database: `hardware_db`
- **Adminer (DB UI):** http://localhost:8080

### Connect the backend

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hardware_db
```

Then push the schema (creates tables) and seed default users + products:

```bash
cd backend
npm run db:push
npm run db:seed
```

Default users: **admin** / **admin123**, **cashier** / **cashier123**

---

## Option 2: Full stack with Docker

Runs frontend + backend + Postgres together:

```bash
docker compose -f docker-compose.full.yml up -d
```

Backend gets `DATABASE_URL` from the compose file. To run migrations **inside** the backend container:

```bash
docker compose -f docker-compose.full.yml exec backend npm run db:push
```

Or run migrations from your machine with the same URL:

```bash
cd backend
set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hardware_db
npm run db:push
```

---

## Option 3: Local PostgreSQL

1. **Install PostgreSQL** (e.g. from https://www.postgresql.org/download/ or via package manager).

2. **Create a database and user** (in `psql` or pgAdmin):

   ```sql
   CREATE USER myuser WITH PASSWORD 'mypassword';
   CREATE DATABASE hardware_db OWNER myuser;
   ```

3. **Set `DATABASE_URL`** in `backend/.env`:

   ```env
   DATABASE_URL=postgresql://myuser:mypassword@localhost:5432/hardware_db
   ```

4. **Push schema:**

   ```bash
   cd backend
   npm run db:push
   ```

---

## Connection string format

```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME
```

- **Docker Postgres:** `postgresql://postgres:postgres@localhost:5432/hardware_db`
- **Docker network (backend container):** `postgresql://postgres:postgres@postgres:5432/hardware_db`

---

## Useful commands

| Task              | Command (from `backend/`)   |
|-------------------|----------------------------|
| Create/update tables | `npm run db:push`        |
| Seed users + products | `npm run db:seed`     |
| Generate migrations | `npx drizzle-kit generate` |
| Open Drizzle Studio | `npx drizzle-kit studio`  |

---

## Adminer (Docker)

When using `docker-compose.pg.yml`, open http://localhost:8080 and log in:

- **System:** PostgreSQL  
- **Server:** `postgres` (in Docker) or `host.docker.internal` / `localhost` (from host)  
- **Username:** `postgres`  
- **Password:** `postgres`  
- **Database:** `hardware_db`  
