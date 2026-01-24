import pkg from 'pg';
const { Pool } = pkg;

// Database configuration based on provided credentials
const pool = new Pool({
  user: 'msaroot',
  host: '76.13.161.88',
  database: 'bandhq',
  password: 'wjdn3bvfjshfb#VSS22',
  port: 5432,
  // SSL is often required for VPS hosted DBs, set to true or rejectUnauthorized: false if needed
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