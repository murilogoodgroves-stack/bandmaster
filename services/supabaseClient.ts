import { createClient, type Session } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseAuthConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const supabaseClient = isSupabaseAuthConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

export const authenticatedFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  if (!supabaseClient) {
    return fetch(input, init);
  }

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) {
    throw new Error(`Could not verify the current sign-in session: ${error.message}`);
  }

  const headers = new Headers(init.headers);
  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }

  return fetch(input, { ...init, headers });
};

export type { Session };
