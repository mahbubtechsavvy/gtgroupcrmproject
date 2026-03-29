const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:@GTgroupcrm2026@db.kjppkkumublhiwzwufhe.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT * FROM public.users');
  console.log('PUBLIC USERS:', res.rows);
  const authRes = await client.query('SELECT id, email FROM auth.users');
  console.log('AUTH USERS:', authRes.rows);
  await client.end();
}

run().catch(console.error);
