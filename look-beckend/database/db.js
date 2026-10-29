import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'look_db',
  password: 'Tumor',
  port: 5432,
});

export default pool;