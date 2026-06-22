import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Singleton client for use in client components
let client = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient();
  }
  return client;
}

let authSessionRequest = null;

export async function getAuthSession() {
  if (!authSessionRequest) {
    authSessionRequest = getSupabaseClient().auth.getSession();
  }

  try {
    return await authSessionRequest;
  } finally {
    authSessionRequest = null;
  }
}

export const supabase = getSupabaseClient();
export default getSupabaseClient;
