import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Placeholders keep createClient from throwing when the env vars are missing;
// the app shows a configuration screen instead of calling Supabase.
export const supabase = createClient(
  SUPABASE_URL || 'http://localhost:54321',
  SUPABASE_ANON_KEY || 'missing-anon-key'
);

/**
 * Users sign in with a username, but Supabase Auth needs an email.
 * Each username maps to an internal address that is never shown to users.
 * MUST match public.username_to_email() in supabase/ceros_db.sql.
 *   'Sample Client' -> 'sample.client@cerosl1.local'
 */
export const USERNAME_EMAIL_DOMAIN = 'cerosl1.local';

export function usernameToEmail(username: string): string {
  const local = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '.')
    .replace(/^\.+|\.+$/g, '');
  return `${local}@${USERNAME_EMAIL_DOMAIN}`;
}

/** Same rule as the user_tb.username CHECK constraint. */
export const USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 ._-]{2,29}$/;
