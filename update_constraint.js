const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:@GTgroupcrm2026@db.kjppkkumublhiwzwufhe.supabase.co:5432/postgres'
});

async function run() {
  console.log('[DB Update] Connecting to Supabase Database...');
  await client.connect();
  
  console.log('[DB Update] Dropping old employee workstation unique constraint...');
  await client.query(`
    ALTER TABLE public.cctv_workstations 
    DROP CONSTRAINT IF EXISTS cctv_workstations_cctv_device_id_employee_id_key;
  `);

  console.log('[DB Update] Adding new flexible unique constraint (device + employee + name)...');
  await client.query(`
    ALTER TABLE public.cctv_workstations 
    ADD CONSTRAINT cctv_workstations_device_employee_name_unique 
    UNIQUE(cctv_device_id, employee_id, name);
  `);
  
  console.log('[DB Update] Schema updated successfully!');
  await client.end();
}

run().catch(err => {
  console.error('[DB Update] Error running database updates:', err);
  process.exit(1);
});
