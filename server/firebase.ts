// Firebase was removed from the runtime. Neon/Postgres is the canonical database.
export const db = null as any;

if (typeof console !== 'undefined') {
  console.warn('Firebase server stub loaded. The app is using Neon/Postgres persistence.');
}
