-- Execute this in the Supabase SQL Editor to create the Nexus Digital tables

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

-- RLS Policies
ALTER TABLE nexus_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all authenticated users to read nexus_leads"
    ON nexus_leads FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to insert nexus_leads"
    ON nexus_leads FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update nexus_leads"
    ON nexus_leads FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to delete nexus_leads"
    ON nexus_leads FOR DELETE TO authenticated USING (true);


CREATE POLICY "Allow all authenticated users to read nexus_portfolio"
    ON nexus_portfolio FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to insert nexus_portfolio"
    ON nexus_portfolio FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to update nexus_portfolio"
    ON nexus_portfolio FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow all authenticated users to delete nexus_portfolio"
    ON nexus_portfolio FOR DELETE TO authenticated USING (true);
