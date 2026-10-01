// Firebase was removed from the runtime. This project persists through Neon/Postgres.
// Keeping this file as a compatibility stub prevents accidental runtime initialization.
export const db = null as any;
export const auth = null as any;

if (typeof console !== 'undefined') {
  console.warn('Firebase compatibility stub loaded. Use Neon/Postgres persistence instead.');
}
