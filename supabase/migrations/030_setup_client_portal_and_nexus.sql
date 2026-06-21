-- ==============================================================================
-- GT GROUP CRM V2.0 - NEXUS & CLIENT PORTAL SETUP SCRIPT
-- Run this in your Supabase SQL Editor to finalize the database schema
-- ==============================================================================

-- 1. Create client_portal_users table (B2C & B2B Client Access)
CREATE TABLE IF NOT EXISTS client_portal_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    client_type VARCHAR(50) NOT NULL CHECK (client_type IN ('student', 'nexus_b2b')),
    reference_id UUID NOT NULL, -- Links to either students.id OR nexus_clients.id
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create nexus_clients table
CREATE TABLE IF NOT EXISTS nexus_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(255),
    industry VARCHAR(100),
    address TEXT,
    assigned_to UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'churned')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create nexus_projects table
CREATE TABLE IF NOT EXISTS nexus_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES nexus_clients(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    project_type VARCHAR(100) NOT NULL CHECK (project_type IN ('web_dev', 'app_dev', 'ai_automation', 'seo', 'branding', 'other')),
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'testing', 'completed', 'on_hold')),
    start_date DATE,
    target_launch_date DATE,
    budget DECIMAL(12,2),
    currency VARCHAR(10) DEFAULT 'USD',
    github_repo VARCHAR(255),
    live_url VARCHAR(255),
    description TEXT,
    assigned_lead UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================================================
-- AIRTIGHT ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE client_portal_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_projects ENABLE ROW LEVEL SECURITY;

-- STAFF ACCESS POLICIES (CRM USERS)
-- Staff can view all portal users, clients, and projects.
CREATE POLICY "Staff can view portal users" ON client_portal_users FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));
CREATE POLICY "Staff can insert portal users" ON client_portal_users FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));
CREATE POLICY "Staff can update portal users" ON client_portal_users FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Staff can view nexus clients" ON nexus_clients FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));
CREATE POLICY "Staff can insert nexus clients" ON nexus_clients FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));
CREATE POLICY "Staff can update nexus clients" ON nexus_clients FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));

CREATE POLICY "Staff can view nexus projects" ON nexus_projects FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));
CREATE POLICY "Staff can insert nexus projects" ON nexus_projects FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));
CREATE POLICY "Staff can update nexus projects" ON nexus_projects FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND is_active = true));

-- CLIENT PORTAL ACCESS POLICIES
-- 1. Clients can view their own profile.
CREATE POLICY "Clients can view their own profile" ON client_portal_users
    FOR SELECT USING (auth.uid() = id);

-- 2. Nexus B2B Clients can view their own company details.
CREATE POLICY "B2B Clients can view their own company" ON nexus_clients
    FOR SELECT USING (
        id IN (SELECT reference_id FROM client_portal_users WHERE id = auth.uid() AND client_type = 'nexus_b2b')
    );

-- 3. Nexus B2B Clients can view their own projects.
CREATE POLICY "B2B Clients can view their own projects" ON nexus_projects
    FOR SELECT USING (
        client_id IN (SELECT reference_id FROM client_portal_users WHERE id = auth.uid() AND client_type = 'nexus_b2b')
    );

-- 4. Student Clients can view their own student record (Assuming a 'students' table exists).
-- Note: Update your existing students table RLS to allow this if it's restricted.
CREATE POLICY "Student clients can view their own student record" ON students
    FOR SELECT USING (
        id IN (SELECT reference_id FROM client_portal_users WHERE id = auth.uid() AND client_type = 'student')
    );

-- Allow students to view their own documents
CREATE POLICY "Student clients can view their own documents" ON documents
    FOR SELECT USING (
        student_id IN (SELECT reference_id FROM client_portal_users WHERE id = auth.uid() AND client_type = 'student')
    );

-- ==============================================================================
-- ADD TRIGGERS FOR UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_nexus_clients_modtime ON nexus_clients;
CREATE TRIGGER update_nexus_clients_modtime
    BEFORE UPDATE ON nexus_clients
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_nexus_projects_modtime ON nexus_projects;
CREATE TRIGGER update_nexus_projects_modtime
    BEFORE UPDATE ON nexus_projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
