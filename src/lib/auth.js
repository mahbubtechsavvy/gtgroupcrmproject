import { getSupabaseClient } from './supabase';

export async function getSession() {
  const supabase = getSupabaseClient();
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  return session;
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  // Fetch full user profile from users table
  const { data: profile } = await supabase
    .from('users')
    .select('*, offices(id, name, country, city)')
    .eq('id', user.id)
    .single();

  return profile || null;
}

export async function signIn(email, password) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

export async function signOut() {
  const supabase = getSupabaseClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function resetPassword(email) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  return { data, error };
}

export function isSupertAdmin(role) {
  return ['ceo', 'coo', 'it_manager'].includes(role);
}

export function isSuperAdmin(role) {
  return ['ceo', 'coo', 'it_manager'].includes(role);
}

export function getRoleLabel(role) {
  const labels = {
    ceo: 'CEO',
    coo: 'COO',
    it_manager: 'IT Manager',
    office_manager: 'Office Manager',
    senior_counselor: 'Senior Counselor',
    counselor: 'Counselor',
    receptionist: 'Receptionist',
  };
  return labels[role] || role;
}
