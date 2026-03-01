# Connecting ML Service to Your Database

Your Node.js backend (`backend/server/db.ts`) is currently configured to use a dual-database approach with **Drizzle ORM**:
1. **Local Offline-first DB:** A local SQLite database (`hardware_store_local.db`).
2. **Remote Synced DB:** An optional PostgreSQL database configured via a `DATABASE_URL` environment variable.

Currently, your Node app writes mainly to the local SQLite database to be offline-first, but eventually syncs to the remote Postgres.

Here is how you can connect your Python ML service to the same databases, along with the best free services you can use!

---

## Part 1: Free Remote Database Services
Since your app is built to use **PostgreSQL** remotely, here are the absolute best free PostgreSQL hosting options as of 2024/2025:

### 1. Neon DB (Highly Recommended)
Neon is a serverless Postgres database. It's incredibly fast to set up and provides generous free limits.
- **Why it's great:** Branching (like Git for databases), fast connection speeds.
- **Link:** [neon.tech](https://neon.tech/)

### 2. Supabase
Supabase is an open-source Firebase alternative heavily based on Postgres.
- **Why it's great:** Gives you a pure Postgres connection string, but also gives a nice UI dashboard to view your data easily.
- **Link:** [supabase.com](https://supabase.com/)

### 3. Render
Render is a cloud application hosting provider that also offers a free Postgres database.
- **Why it's great:** The database lasts forever on the free tier (Neon pauses if inactive), though it is limited in storage space.
- **Link:** [render.com](https://render.com/)

*Once you sign up for any of these, they will give you a "Connection String" (starts with `postgresql://...`). You just put that string in your backend's `.env` file as `DATABASE_URL=postgres://...`.*

---

## Part 2: How to Connect Python to the Database

You have two choices for your ML service: read from the local SQLite file (simplest, zero latency), or read from the remote PostgreSQL database (best if your ML service runs on a different server).

### Option A: Read from the local SQLite Database (Recommended for Local Dev)
Since your Node.js app creates a file called `hardware_store_local.db` in your backend folder, Python can read it directly!

1. Open `ml-service/requirements.txt` and add `SQLAlchemy`:
   ```text
   SQLAlchemy==2.0.23
   ```
2. Update your `ml-service/app.py` to read the SQLite file:
   ```python
   from sqlalchemy import create_engine
   import pandas as pd

   # Change this path to point exactly to your backend's .db file
   DB_PATH = "../backend/hardware_store_local.db"
   engine = create_engine(f"sqlite:///{DB_PATH}")

   # Example: Read products table into a DataFrame
   def load_products_from_db():
       try:
           # Assuming you have a 'products' table in your schema
           df = pd.read_sql("SELECT * FROM products", engine)
           print(f"Loaded {len(df)} products from local SQLite")
           return df
       except Exception as e:
           print(f"Failed to read from DB: {e}")
           return None
   ```

### Option B: Read from your Remote PostgreSQL Database
If you use Neon, Supabase, or another provider, your Python service needs `psycopg2` to talk to Postgres.

1. Add these to `ml-service/requirements.txt`:
   ```text
   SQLAlchemy==2.0.23
   psycopg2-binary==2.9.9
   ```
2. Connect using the exact same URL Node.js uses:
   ```python
   from sqlalchemy import create_engine
   import pandas as pd
   import os

   # Get this from your environment or hardcode for testing
   DATABASE_URL = "postgresql://user:password@hostname:port/dbname"
   engine = create_engine(DATABASE_URL)

   def load_remote_data():
       # Your SQL query here
       df = pd.read_sql("SELECT * FROM sales", engine)
       return df
   ```

### Next Steps Setup Sequence:
1. Go to **Neon.tech** or **Supabase** and create a free Postgres database.
2. Get the connection URL.
3. Put it in `backend/.env` under `DATABASE_URL`.
4. Let me know if you want the Python service to read the local SQLite file or the remote Postgres one so I can write the exact code for you!
