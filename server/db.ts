import pkg from 'pg';
const { Pool } = pkg;

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

const hasLegacyDbConfig = Boolean(
  process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD
);

const poolConfig = connectionString
  ? { connectionString, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: false } }
  : hasLegacyDbConfig
    ? {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: Number(process.env.DB_PORT || 5432),
        ssl: { rejectUnauthorized: false }
      }
    : null;

const pool = poolConfig ? new Pool(poolConfig) : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

export const isDatabaseConfigured = Boolean(pool);

export const query = async (text: string, params?: any[]) => {
  if (!pool) {
    throw new Error('Database is not configured. Set DATABASE_URL or DB_* env vars.');
  }

  return pool.query(text, params);
};

export const getDatabaseStatus = () => ({
  configured: isDatabaseConfigured,
  source: connectionString ? 'DATABASE_URL' : hasLegacyDbConfig ? 'DB_*' : 'missing'
});

export default pool;