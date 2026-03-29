const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://kjppkkumublhiwzwufhe.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqcHBra3VtdWJsaGl3end1ZmhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2NzYwNzIsImV4cCI6MjA5MDI1MjA3Mn0.7sxa4t1K4VZMEE_xeyLTodgGJy1fphV0ZS7UDw3wSuc');

async function check() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@gtgroup.com',
    password: '@GTgroupcrm2026'
  });
  console.log('DATA:', JSON.stringify(data, null, 2));
  console.log('ERROR:', error);
}
check();
