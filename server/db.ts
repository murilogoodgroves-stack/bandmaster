import 'dotenv/config';
import pkg from 'pg';
import type { CronLog } from '../types';
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

export const initializeDatabase = async () => {
  if (!pool) {
    return false;
  }

  await query(`
    CREATE TABLE IF NOT EXISTS cron_logs (
      id SERIAL PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL CHECK (status IN ('success', 'failure')),
      message TEXT NOT NULL,
      server_time TIMESTAMPTZ,
      details JSONB DEFAULT '{}'::jsonb
    );
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS app_state_snapshots (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_cron_logs_timestamp
    ON cron_logs (timestamp DESC);
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_app_state_snapshots_updated_at
    ON app_state_snapshots (updated_at DESC);
  `);

  return true;
};

export const writeCronLog = async (log: Omit<CronLog, 'id'> & { details?: Record<string, unknown> }) => {
  if (!pool) {
    return null;
  }

  const result = await query(
    `
      INSERT INTO cron_logs (timestamp, status, message, server_time, details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, timestamp, status, message, server_time AS "serverTime", details;
    `,
    [
      log.timestamp,
      log.status,
      log.message,
      log.serverTime ?? new Date().toISOString(),
      log.details ?? {}
    ]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    timestamp: row.timestamp,
    status: row.status,
    message: row.message,
    serverTime: row.serverTime,
  } as CronLog;
};

export const getRecentCronLogs = async (limit = 10): Promise<CronLog[]> => {
  if (!pool) {
    return [];
  }

  const result = await query(
    `
      SELECT id, timestamp, status, message, server_time AS "serverTime"
      FROM cron_logs
      ORDER BY timestamp DESC
      LIMIT $1;
    `,
    [limit]
  );

  return result.rows.map((row) => ({
    id: String(row.id),
    timestamp: row.timestamp,
    status: row.status,
    message: row.message,
    serverTime: row.serverTime,
  }));
};

export const saveAppStateSnapshot = async (key: string, payload: Record<string, unknown>) => {
  if (!pool) {
    return null;
  }

  await initializeDatabase();

  const result = await query(
    `
      INSERT INTO app_state_snapshots (key, payload, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (key)
      DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()
      RETURNING key, payload, updated_at AS "updatedAt";
    `,
    [key, payload ?? {}]
  );

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  return {
    key: row.key,
    payload: row.payload,
    updatedAt: row.updatedAt,
  };
};

export const loadAppStateSnapshot = async (key: string): Promise<Record<string, unknown> | null> => {
  if (!pool) {
    return null;
  }

  await initializeDatabase();

  const result = await query(
    `
      SELECT payload
      FROM app_state_snapshots
      WHERE key = $1
      LIMIT 1;
    `,
    [key]
  );

  return result.rowCount ? (result.rows[0].payload as Record<string, unknown>) : null;
};

export const getDatabaseStatus = () => ({
  configured: isDatabaseConfigured,
  source: connectionString ? 'DATABASE_URL' : hasLegacyDbConfig ? 'DB_*' : 'missing'
});

export default pool;