# 🖥️ Hardware Store Backend

The mission-critical engine powering the Hardware Store Management System. This server is designed for high reliability, strict type safety, and seamless cloud synchronization.

---

## ⚙️ Core Architecture

### 1. Dual-Database Connectivity (`db.ts`)
The backend maintains two connection pools:
- **Primary Pool**: Connects to the local PostgreSQL instance for zero-latency operations.
- **Remote Pool**: Connects to the Supabase cloud instance for persistence and multi-site synchronization.

### 2. Synchronization Daemon (`syncManager.ts`)
Every data-modifying operation logs a record to the `sync_queue` table. A background daemon polls this queue every 15 seconds and reconciles changes with the remote database, ensuring your data is always safe in the cloud even during internet outages.

### 3. Data Access Layer (`storage.ts`)
We use a centralized Storage class that abstracts all database interactions. This ensures that the business logic in controllers remains clean and decoupled from the ORM implementation.

---

## 🛠️ API Modules

- **Auth**: JWT-based authentication with Bcrypt password hashing.
- **Products**: Full inventory lifecycle management including category filtering and stock reconciliation.
- **Sales**: Transactional POS logic that handles stock deduction, tax calculation, and loyalty point issuance atomically.
- **Payroll**: Automated calculation of earnings based on attendance logs and staff configuration.
- **Reports**: Aggregate data generation for financial performance and inventory turnover.

---

## 🚀 Running the Backend

### Development Mode
```bash
npm install
npm run dev
```

### Database Management
```bash
# Push schema changes to Postgres
npx drizzle-kit push

# Seed default users and products
npx tsx server/seed.ts

# Open Drizzle Studio to browse data
npm run db:studio
```

---

## 🔒 Security
- **JWT Auth**: All sensitive endpoints require a valid Bearer token.
- **Zod Validation**: Every request body is validated against a schema before being processed.
- **SSL**: Remote connections are secured via SSL with certificate validation (configurable via `NODE_TLS_REJECT_UNAUTHORIZED`).
