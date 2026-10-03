import 'dotenv/config';
import { isDatabaseConfigured, query, resolveDatabaseSource } from '../server/db';

const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const frontendSupabaseUrl = process.env.VITE_SUPABASE_URL?.trim();
const frontendSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();

let checksPassed = true;

const normalizedUrl = (value: string) => value.replace(/\/+$/, '');

if (!supabaseUrl || !supabaseAnonKey || !frontendSupabaseUrl || !frontendSupabaseKey) {
  console.error('Supabase Auth: FAIL (server and browser URL/public-key settings must all be configured).');
  checksPassed = false;
} else if (normalizedUrl(supabaseUrl) !== normalizedUrl(frontendSupabaseUrl) || supabaseAnonKey !== frontendSupabaseKey) {
  console.error('Supabase Auth: FAIL (server and browser settings do not match).');
  checksPassed = false;
} else {
  try {
    const healthUrl = new URL('/auth/v1/health', supabaseUrl);
    const response = await fetch(healthUrl, {
      headers: { apikey: supabaseAnonKey },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(`Supabase Auth: FAIL (health endpoint returned HTTP ${response.status}; no credentials were printed).`);
      checksPassed = false;
    } else {
      console.log(`Supabase Auth: PASS (health endpoint HTTP ${response.status}; this does not verify a user sign-in).`);
    }
  } catch {
    console.error('Supabase Auth: FAIL (health endpoint could not be reached; check URL and network).');
    checksPassed = false;
  }
}

if (!isDatabaseConfigured) {
  console.error(`Neon/Postgres: BLOCKED (no supported database URL is configured; source=${resolveDatabaseSource()}).`);
  checksPassed = false;
} else {
  try {
    await query('SELECT 1 AS connection_ok');
    console.log(`Neon/Postgres: PASS (read-only SELECT succeeded; source=${resolveDatabaseSource()}).`);
  } catch {
    console.error(`Neon/Postgres: FAIL (connection/query failed; source=${resolveDatabaseSource()}; details omitted to avoid leaking credentials).`);
    checksPassed = false;
  }
}

if (!checksPassed) {
  process.exitCode = 1;
}
