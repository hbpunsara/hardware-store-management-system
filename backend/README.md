# Backend - Hardware Store Management System

This directory contains the REST API server and database logic for the Hardware Store Management System.

## Architecture

The backend is a monolithic server running **Node.js** with **Express.js**, heavily leveraging TypeScript for memory-safe development. Relational database connectivity is managed via **Drizzle ORM**.

### Key Tools & Libraries
- **Express.js**: The HTTP web framework parsing routes and payloads.
- **Drizzle ORM**: A headless, type-safe data mapper mapped tightly against a PostgreSQL engine.
- **PostgreSQL**: The relational data store handling complex joins (Transactions, Sub-items, Payroll records).
- **Zod**: Runtime schema validation enforcing strict types before DB writing operations.
- **esbuild**: An extremely fast JS bundler used to output the production executable script.

## Project Structure

```
backend/
├── server/
│   ├── controllers/      # Route logic handlers (Products, Employees, Payroll, Reports, etc.)
│   ├── db.ts             # Instantiating the Postgres client and binding Drizzle
│   ├── index.ts          # Express start up script
│   ├── routes.ts         # Central HTTP method binding returning API endpoints
│   └── storage.ts        # The centralized Data Access Object providing direct queries/insertions
├── shared/
│   └── schema.ts         # The absolute source of truth: defining SQL Tables and Exporting Zod Types
├── package.json          # Node dependencies and execution scripts
├── drizzle.config.ts     # Drizzle studio configuration
└── .env                  # Environment secrets containing database connection string
```

## Core Domain Models

- **Users**: Admin, Cashier, Inventory Managers authenticated credentials.
- **Employees**: Staff personnel details, status, and role tracking.
- **Products & Inventory**: SKUs, Categories, Supplier linkage, and quantity monitoring.
- **Sales & Sale Items**: 1-to-many relationship linking a checkout transaction to exact items bought.
- **Payrolls**: Automated dynamic generation of employee salary records for specific months.
- **Transactions (Finance)**: Broad ledger of arbitrary store revenues and operational expenses.

## Available Scripts

From the `backend` directory, you can run:

- `npm run dev`: Starts the dev server using `tsx` (hot-reloads TS natively). Usually runs on port `5000`.
- `npm run db:push`: Synchronizes your defined Drizzle `schema.ts` tables with your live PostgreSQL instance natively.
- `npm run db:seed`: Populates the database with initial mock data sets for testing purposes.
- `npm run build`: Bundles the `server/index.ts` map into standard Node ECMAScript module outputs via esbuild.
- `npm start`: Runs the built production `dist/index.js` application.

## API Note
Ensure `DATABASE_URL` is configured in your local `.env` file before executing any startup or database push commands.
