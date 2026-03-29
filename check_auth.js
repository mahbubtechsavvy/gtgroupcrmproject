const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://kjppkkumublhiwzwufhe.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcHBra3VtdWJsaGl3end1ZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzYwNzIsImV4cCI6MjA5MDI1MjA3Mn0.7sxa4t1K4VZMEE_xeyLTodgGJy1fphV0ZS7UDw3wSuc');

async function check() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@gtgroup.com',
    password: '@GTgroupcrm2026'
  });
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*, offices!users_office_id_fkey(id, name, country, city)')
    .eq('id', data.user.id)
    .single();

  console.log('PROFILE:', JSON.stringify(profile, null, 2));
  console.log('PROFILE ERROR:', profileError);
}
check();
