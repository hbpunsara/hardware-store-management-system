import pg from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10000,
    ssl: { rejectUnauthorized: false }
});

pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name",
    (err, res) => {
        if (err) {
            console.log('FAIL:', err.message);
        } else {
            console.log('DB_OK! Tables found:', res.rows.length);
            res.rows.forEach(r => console.log(' -', r.table_name));
        }
        pool.end();
    }
);
