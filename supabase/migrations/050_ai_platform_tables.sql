-- ================================================================
-- 050: GT AI PLATFORM TABLES
-- ================================================================

BEGIN;

-- 1. AI Generations Table
CREATE TABLE IF NOT EXISTS ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('sop','study_plan','self_intro','resume','cv','cover_letter','university_form','advice')),
  model_used TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  input_data JSONB,
  output_text TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  final_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. AI Document Analyses Table
CREATE TABLE IF NOT EXISTS ai_document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  documents_analyzed TEXT[],       -- Array of document file names/URLs or document IDs
  extracted_data JSONB,            -- Extracted information (Name, DOB, Passport No, NID)
  comparison_result JSONB,         -- Cross-document discrepancy reports
  error_report JSONB,              -- Detected mismatched fields
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  missing_documents TEXT[],        -- List of missing documents from standard checklist
  suggested_fixes TEXT[],          -- Actionable recommendations
  model_used TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Human Document Reviews Table
CREATE TABLE IF NOT EXISTS human_document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_review','approved','rejected','needs_fixes')),
  review_notes TEXT,
  error_markings JSONB,            -- JSON containing marked error fields & documents
  recommendations TEXT[],
  final_approval BOOLEAN DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_document_reviews ENABLE ROW LEVEL SECURITY;

-- 5. Create Tenant Isolation Policies (Own office or super admin role)
CREATE POLICY "ai_generations_isolation" ON ai_generations
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

CREATE POLICY "ai_document_analyses_isolation" ON ai_document_analyses
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

CREATE POLICY "human_document_reviews_isolation" ON human_document_reviews
  FOR ALL TO authenticated USING (
    is_super_admin() OR office_id = get_my_office_id()
  );

COMMIT;
