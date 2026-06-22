const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const connectionString = 'postgresql://postgres:@GTgroupcrm2026@db.kjppkkumublhiwzwufhe.supabase.co:5432/postgres';

async function run() {
  console.log('Connecting to database...');
  const client = new Client({ connectionString });
  await client.connect();

  console.log('Reading migration file...');
  const migrationPath = path.join(__dirname, '../supabase/migrations/051_events_marketing_tables.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Executing migration...');
  await client.query(sql);

  console.log('Migration executed successfully!');
  await client.end();
}

run().catch(err => {
  console.error('Error applying migration:', err);
  process.exit(1);
});
