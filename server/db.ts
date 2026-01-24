import pkg from 'pg';
const { Pool } = pkg;

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'msaroot',
  host: process.env.DB_HOST || '76.13.161.88',
  database: process.env.DB_NAME || 'bandhq',
  password: process.env.DB_PASSWORD || 'wjdn3bvfjshfb#VSS22',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  (process as any).exit(-1);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
export default pool;