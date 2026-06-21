const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseServiceKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseServiceKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQL() {
  const query = `
    CREATE TABLE IF NOT EXISTS nexus_leads (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      client_name TEXT NOT NULL,
      company_name TEXT,
      email TEXT,
      phone TEXT,
      project_type TEXT NOT NULL,
      budget TEXT,
      pipeline_status TEXT DEFAULT 'new_lead',
      priority TEXT DEFAULT 'medium',
      assigned_to UUID REFERENCES users(id),
      created_by UUID REFERENCES users(id),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS nexus_portfolio (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_title TEXT NOT NULL,
      client_name TEXT NOT NULL,
      project_type TEXT NOT NULL,
      technologies_used TEXT[],
      live_url TEXT,
      results_metrics TEXT,
      description TEXT,
      images_urls TEXT[],
      featured BOOLEAN DEFAULT false,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Try using Postgres Meta API or a custom exec_sql rpc if available.
  // Actually, we can't reliably run raw SQL via the JS client without an RPC like 'exec_sql'.
  // If exec_sql doesn't exist, we will use the local Supabase CLI or create the files in supabase/migrations.
  const { data, error } = await supabase.rpc('exec_sql', { query_text: query });
  
  if (error) {
    console.log('Error creating tables using RPC. Proceeding to create migration files instead.');
    console.log(error.message);
  } else {
    console.log('Successfully created nexus_leads and nexus_portfolio tables.');
  }
}

runSQL();
