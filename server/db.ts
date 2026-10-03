import 'dotenv/config';
import pkg from 'pg';
import type { CronLog } from '../types';
const { Pool } = pkg;

const getEnvValue = (...keys: string[]) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '';
};

const getDatabaseConnectionString = () => getEnvValue(
  'DATABASE_URL',
  'POSTGRES_URL',
  'POSTGRES_PRISMA_URL',
  'NEON_DATABASE_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING'
);

const getLegacyDbConfig = () => Boolean(
  getEnvValue('DB_HOST') && getEnvValue('DB_NAME') && getEnvValue('DB_USER') && getEnvValue('DB_PASSWORD')
) || Boolean(
  getEnvValue('PGHOST') && getEnvValue('PGDATABASE') && getEnvValue('PGUSER') && getEnvValue('PGPASSWORD')
);

export const resolveDatabaseSource = () => {
  if (getEnvValue('DATABASE_URL')) return 'DATABASE_URL';
  if (getEnvValue('POSTGRES_URL')) return 'POSTGRES_URL';
  if (getEnvValue('POSTGRES_PRISMA_URL')) return 'POSTGRES_PRISMA_URL';
  if (getEnvValue('NEON_DATABASE_URL')) return 'NEON_DATABASE_URL';
  if (getEnvValue('DATABASE_URL_UNPOOLED')) return 'DATABASE_URL_UNPOOLED';
  if (getEnvValue('POSTGRES_URL_NON_POOLING')) return 'POSTGRES_URL_NON_POOLING';
  if (getLegacyDbConfig()) return 'DB_*';
  return 'missing';
};

const connectionString = getDatabaseConnectionString();
const hasLegacyDbConfig = getLegacyDbConfig();

const poolConfig = connectionString
  ? { connectionString, ssl: connectionString.includes('localhost') ? false : { rejectUnauthorized: true } }
  : hasLegacyDbConfig
    ? {
        user: getEnvValue('DB_USER', 'PGUSER', 'POSTGRES_USER'),
        host: getEnvValue('DB_HOST', 'PGHOST', 'POSTGRES_HOST'),
        database: getEnvValue('DB_NAME', 'PGDATABASE', 'POSTGRES_DATABASE'),
        password: getEnvValue('DB_PASSWORD', 'PGPASSWORD', 'POSTGRES_PASSWORD'),
        port: Number(getEnvValue('DB_PORT', 'PGPORT', 'POSTGRES_PORT') || '5432'),
        ssl: { rejectUnauthorized: true }
      }
    : null;

const pool = poolConfig
  ? new Pool({
      ...poolConfig,
      max: Number(getEnvValue('PG_POOL_MAX') || (process.env.VERCEL ? '1' : '10')),
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    })
  : null;

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
    CREATE TABLE IF NOT EXISTS user_app_state_snapshots (
      owner_id TEXT NOT NULL,
      key TEXT NOT NULL,
      payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      revision BIGINT NOT NULL DEFAULT 1,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (owner_id, key)
    );
  `);

  await query(`
    CREATE INDEX IF NOT EXISTS idx_cron_logs_timestamp
    ON cron_logs (timestamp DESC);
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

export const saveUserAppStateSnapshot = async (ownerId: string, key: string, payload: Record<string, unknown>) => {
  if (!pool) {
    return null;
  }

  const result = await query(
    `
      INSERT INTO user_app_state_snapshots (owner_id, key, payload, updated_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (owner_id, key)
      DO UPDATE SET
        payload = EXCLUDED.payload,
        revision = user_app_state_snapshots.revision + 1,
        updated_at = NOW()
      RETURNING owner_id AS "ownerId", key, payload, revision, updated_at AS "updatedAt";
    `,
    [ownerId, key, payload]
  );

  return result.rows[0] ?? null;
};

export const loadUserAppStateSnapshot = async (ownerId: string, key: string): Promise<Record<string, unknown> | null> => {
  if (!pool) {
    return null;
  }

  const result = await query(
    `
      SELECT payload
      FROM user_app_state_snapshots
      WHERE owner_id = $1 AND key = $2
      LIMIT 1;
    `,
    [ownerId, key]
  );

  return result.rowCount ? (result.rows[0].payload as Record<string, unknown>) : null;
};

export const deleteUserAppStateSnapshot = async (ownerId: string, key: string) => {
  if (!pool) {
    return;
  }
  await query('DELETE FROM user_app_state_snapshots WHERE owner_id = $1 AND key = $2;', [ownerId, key]);
};

export const getDatabaseStatus = () => ({
  configured: isDatabaseConfigured,
  source: resolveDatabaseSource()
});

export default pool;