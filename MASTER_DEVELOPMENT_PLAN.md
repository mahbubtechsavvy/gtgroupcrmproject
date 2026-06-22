# GT Group CRM — Master Development Plan

> **Audience**: AI coding agents and human developers.
> **Purpose**: Single authoritative plan covering architecture, all modules, coding standards, and delivery phases.
> **Cross-Reference**: Read `TECH_STACK.md` for technology details and `newupdate-crmproject.md` for product requirements.

---

## 📌 Project Summary

| Field              | Value                                                                  |
|--------------------|------------------------------------------------------------------------|
| **Product**        | GT Group CRM — Multi-Tenant SaaS for Study Abroad Industry             |
| **Tenants**        | Study Abroad Agencies, Universities, GT Group Internal Team            |
| **Architecture**   | Next.js 14 Monolith (App Router) + Python Flask Microservice           |
| **Database**       | Supabase PostgreSQL + Row Level Security                               |
| **Auth**           | Supabase Auth (JWT) + RBAC                                             |
| **Deployment**     | Vercel (frontend) + Docker (services)                                  |
| **Status**         | Completed — Phases 1–10 fully implemented and complete                 |

---

## 🏗️ System Architecture (Canonical)

```
┌──────────────────────────────────────────────────────────────────┐
│  BROWSER (React 18 + Next.js 14 App Router)                      │
│  Port 3005 (dev) | gtgroupcrmproject.vercel.app (prod)           │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTPS / WSS
┌──────────────────────▼───────────────────────────────────────────┐
│  NEXT.JS 14 (App Router — SSR + API Routes)                      │
│  src/app/            → All pages                                 │
│  src/app/api/        → REST API endpoints (Node.js runtime)      │
│  src/middleware.js   → Auth guard (Supabase SSR cookies)         │
└───────┬─────────────────────────────────┬────────────────────────┘
        │ Supabase SDK                    │ HTTP Proxy
┌───────▼──────────────┐     ┌────────────▼───────────────────────┐
│  SUPABASE (Cloud)    │     │  PYTHON FLASK MICROSERVICE         │
│  ├─ PostgreSQL DB    │     │  services/cctv_tracker/app.py      │
│  ├─ Auth (JWT)       │     │  Port 5001 | YOLO + OpenCV         │
│  ├─ Storage Buckets  │     │  Employee tracking, CCTV streaming │
│  ├─ Realtime WS      │     └────────────────────────────────────┘
│  └─ Edge Functions   │
└──────────────────────┘
        │ API calls
┌───────▼───────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                │
│  Google OAuth2/Calendar/Meet | Resend Email | OpenRouter AI      │
│  LibreTranslate (Docker :5000) | HLS.js | FFmpeg                 │
└───────────────────────────────────────────────────────────────────┘
```

**Key Architecture Rules for AI Agents:**
1. **No separate NestJS backend** — all API logic lives in `src/app/api/` Next.js route handlers.
2. **Python** is only used for the CCTV tracker microservice (`services/cctv_tracker/`). Do NOT use Python for CRM business logic.
3. **Supabase is the single database** — no separate PostgreSQL instance.
4. **All data isolation** is enforced via `office_id` column + Supabase RLS policies.
5. **Redis** is planned for future caching — not yet implemented.

---

## 🔧 Confirmed Technology Decisions

### What is ACTUALLY Used (Current Codebase)

| Layer          | Technology                              | Notes                                     |
|----------------|-----------------------------------------|-------------------------------------------|
| Framework      | **Next.js 14** (App Router)             | Use 14.x — NOT 15 yet                     |
| UI Library     | **React 18**                            | Use 18.x — NOT React 19 yet               |
| Language       | **JavaScript (JSX)** primary            | TypeScript config exists but JSX is used  |
| Styling        | **Tailwind CSS 3.x** + CSS Modules      | No Shadcn UI in current impl              |
| Database       | **Supabase PostgreSQL**                 | Project ref: `kjppkkumublhiwzwufhe`       |
| Auth           | **Supabase Auth** (JWT + cookies)       | Via `@supabase/ssr`                       |
| Storage        | **Supabase Storage**                    | Buckets: student-documents, chat-attachments |
| Realtime       | **Supabase Realtime** (WebSocket)       | Used in chat module                       |
| Python Backend | **Flask + OpenCV + YOLO**               | CCTV tracker only                         |
| Email          | **Resend API**                          | Transactional only                        |
| Charts         | **Recharts**                            | Analytics dashboards                      |
| Drag & Drop    | **@dnd-kit**                            | Pipeline Kanban board                     |
| Rich Text      | **TipTap**                              | Notes, email composer                     |
| Translation    | **LibreTranslate** (Docker)             | Chat translation, port 5000               |

### Technology Targets for New Development (Phases 5–10)

| Layer          | Technology                              | When to Use                               |
|----------------|-----------------------------------------|-------------------------------------------|
| Framework      | Upgrade to **Next.js 15** + **React 19**| Only when migrating — Phase 9             |
| Type Safety    | **TypeScript** (strict mode)            | All new files in Phase 5+                 |
| UI Components  | **Shadcn UI** (over Tailwind)           | New AI and portal pages only              |
| AI Gateway     | **OpenRouter** (primary)                | Multi-model routing                       |
| AI Models      | OpenAI, Claude, Gemini, DeepSeek, Llama | Via OpenRouter                            |
| Document AI    | **LayoutLM** + Vision AI + OCR          | Document analysis system                  |
| Cache          | **Redis** (Upstash or self-hosted)      | Phase 6 — session cache, rate limiting    |
| Storage        | **S3-compatible** (Supabase or Cloudflare R2) | Phase 5 — large file/video storage  |
| Mobile         | **React Native + Expo**                 | Phase 10                                  |
| CI/CD          | **GitHub Actions**                      | Phase 8                                   |
| Container Orch | **Docker Compose** (dev) → **K8s** (prod) | Phase 9                                 |

---

## 📋 Module Inventory & Status

### ✅ Completed Modules (Phases 1–4)

| Module             | Route              | Description                                    |
|--------------------|--------------------|------------------------------------------------|
| Authentication     | `/login`           | Supabase Auth, JWT session, middleware guard   |
| Dashboard          | `/dashboard`       | KPIs, Recharts, activity feed                  |
| Students/Leads     | `/students`        | CRUD, tabs: Overview/Docs/Payments/Notes/History |
| Contacts           | `/contacts`        | Contact management                             |
| Pipeline (Kanban)  | `/pipeline`        | @dnd-kit drag-and-drop, stage history          |
| Appointments       | `/appointments`    | Calendar, scheduling, email reminders          |
| Tasks & Events     | `/tasks-events`    | Task CRUD with event calendar                  |
| Chat System        | `/chat`            | Real-time messaging, DMs, groups, file sharing |
| CCTV Monitoring    | `/cctv`            | Live stream, YOLO employee tracking            |
| HR Management      | `/hr`              | Attendance, leave, employee records            |
| Expenses           | `/expenses`        | Expense tracking with categories               |
| Expenditure        | `/expenditure`     | Expenditure reports + PDF/Excel export         |
| Reports            | `/reports`         | Analytics, conversion funnels                  |
| Inventory          | `/inventory`       | Inventory management                           |
| Visitors           | `/visitors`        | Visitor check-in/out                           |
| Social Media       | `/social-media`    | GT Social marketing assets                     |
| Settings           | `/settings`        | Users, offices, permissions, general           |
| University Portal  | `/portal`          | University-facing application review           |
| Work Schedule      | `/work_schedule`   | Staff scheduling                               |

### 🔜 Planned Modules (Phases 5–10)

| Module                     | Route                   | Phase  |
|----------------------------|-------------------------|--------|
| GT AI Platform             | `/ai`                   | 5      |
| SOP / Resume Generator     | `/ai/sop-generator`     | 5      |
| Student Advisor AI         | `/ai/advisor`           | 5      |
| University Form Assistant  | `/ai/form-assistant`    | 5      |
| AI Document Analysis       | `/ai/document-analysis` | 5      |
| Human Document Review      | `/document-review`      | 5      |
| Marketing Support AI       | `/marketing`            | 6      |
| Events & Expo Module       | `/events`               | 6      |
| GT Social Module (Full)    | `/social`               | 6      |
| University Application Mgmt| `/applications`         | 7      |
| Financial Management       | `/finance`              | 7      |
| Notification Center        | `/notifications`        | 7      |
| Subscription & Billing     | `/billing`              | 8      |
| Admin Super Panel          | `/admin`                | 8      |
| Mobile App (React Native)  | Separate App            | 10     |
| Public API / Webhooks      | `/api/v1/public/`       | 9      |

---

## 📁 Canonical File & Folder Structure

Every developer and AI agent must follow this structure exactly:

```
gtgroupcrmproject/
│
├── src/
│   ├── app/                          ← Next.js App Router (ALL pages here)
│   │   ├── layout.jsx                ← Root layout (fonts, metadata)
│   │   ├── page.jsx                  ← Root redirect → /dashboard or /login
│   │   ├── login/page.jsx            ← Public: Auth page
│   │   │
│   │   ├── [module]/                 ← Protected: each module has its folder
│   │   │   └── page.jsx              ← Module main page
│   │   │
│   │   └── api/                      ← Backend API routes (Node.js runtime)
│   │       └── [module]/
│   │           └── route.js          ← GET/POST/PUT/DELETE handlers
│   │
│   ├── components/                   ← Reusable UI components
│   │   ├── layout/                   ← Sidebar, Header, AuthGuard
│   │   ├── ui/                       ← Shared: Modal, Button, Badge, Table
│   │   ├── dashboard/                ← KPICard, Charts, ActivityFeed
│   │   ├── students/                 ← StudentTable, StudentForm, Profile tabs
│   │   ├── pipeline/                 ← KanbanBoard, KanbanCard
│   │   ├── chat/                     ← ChatShell, MessageBubble, MessageInput
│   │   │   ├── ChatShell.jsx         ← Master orchestrator (state + realtime)
│   │   │   ├── sidebar/              ← ChatSidebar, GroupItem, DMItem
│   │   │   ├── messages/             ← MessageList, MessageBubble, MessageInput
│   │   │   └── header/               ← ChatHeader
│   │   ├── cctv/                     ← CameraFeed, MonitoringUI
│   │   ├── ai/                       ← [NEW Phase 5] AI module components
│   │   └── finance/                  ← [NEW Phase 7] Finance components
│   │
│   ├── lib/                          ← Utility modules & service clients
│   │   ├── supabase.js               ← Browser Supabase client (createClient)
│   │   ├── supabase-server.js        ← Server Supabase client (cookies)
│   │   ├── auth.js                   ← Auth helpers: getCurrentUser, signOut
│   │   ├── permissions.js            ← RBAC: can(), isSuperAdmin()
│   │   ├── emailRouter.js            ← Email routing logic
│   │   ├── emailSending.js           ← Resend API wrapper
│   │   ├── emailAccountManager.js    ← Gmail OAuth account management
│   │   ├── emailTemplates/           ← HTML email templates
│   │   ├── googleOAuth.js            ← Google OAuth2 flow helpers
│   │   ├── googleCalendar.js         ← Google Calendar API
│   │   ├── googleMeet.js             ← Google Meet API
│   │   ├── notifications.js          ← In-app notification helpers
│   │   ├── permissions.js            ← Role permission matrix & checks
│   │   ├── flagMapping.js            ← Country → flag emoji mapping
│   │   ├── cropImage.js              ← Avatar image crop utility
│   │   ├── chat-storage.js           ← Chat file upload helpers
│   │   ├── useAppSettings.js         ← App settings hook
│   │   ├── cctv/                     ← CCTV stream utilities
│   │   ├── pdf/                      ← PDF generation helpers
│   │   ├── social-media/             ← Social media helpers
│   │   └── ai/                       ← [NEW Phase 5] OpenRouter AI client
│   │
│   ├── context/                      ← React Context providers
│   ├── hooks/                        ← Custom React hooks
│   ├── services/                     ← Frontend service layers
│   └── styles/                       ← CSS Modules per page/component
│
├── supabase/
│   ├── migrations/                   ← SQL files: NNN_name.sql (numbered!)
│   └── functions/                    ← Edge Functions (email triggers)
│
├── services/
│   └── cctv_tracker/                 ← Python Flask AI microservice
│       ├── app.py                    ← Flask entry point
│       ├── employee_tracking_fixed.py← YOLO detection logic
│       ├── requirements.txt          ← Python deps
│       └── yolo_model/               ← AI model weights
│
└── public/                           ← Static assets
    ├── logo-gt-group.png
    └── country_flags/
```

---

## 🗄️ Database Schema — Full Reference

### Naming Conventions
- All tables: `snake_case` plural (e.g., `students`, `chat_messages`)
- All PKs: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- All timestamps: `TIMESTAMPTZ DEFAULT now()`
- Tenant isolation: every table that holds tenant data MUST have `office_id UUID REFERENCES offices(id)`

### Existing Tables (Do Not Modify Without Migration)

```sql
-- offices, users, role_permissions, destinations, universities, programs
-- students, pipeline_history, appointments, payments, documents, interactions
-- chat_conversations, chat_direct_messages, chat_message_reads
-- chat_attachments, chat_presence, chat_message_translations
-- chat_user_preferences, chat_notifications, chat_pinned_messages
```

### New Tables Required for Phase 5–10

```sql
-- ============================================================
-- PHASE 5: GT AI PLATFORM
-- ============================================================

CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id),
  type TEXT NOT NULL CHECK (type IN ('sop','study_plan','self_intro','resume','cv','cover_letter','university_form','advice')),
  model_used TEXT NOT NULL,        -- e.g. 'openai/gpt-4o', 'anthropic/claude-3.5-sonnet'
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  input_data JSONB,                -- Student data used as context
  output_text TEXT NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  final_text TEXT,                 -- After user edits
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE ai_document_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed')),
  documents_analyzed TEXT[],       -- Array of document_ids analyzed
  extracted_data JSONB,            -- Extracted fields per document
  comparison_result JSONB,         -- Cross-document mismatch analysis
  error_report JSONB,              -- Detected errors
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  missing_documents TEXT[],
  suggested_fixes TEXT[],
  model_used TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE human_document_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  reviewer_id UUID REFERENCES users(id),  -- GT Group expert counselor
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_review','approved','rejected','needs_fixes')),
  review_notes TEXT,
  error_markings JSONB,            -- Specific errors marked
  recommendations TEXT[],
  final_approval BOOLEAN,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 6: EVENTS & EXPO + MARKETING
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('event','expo','webinar','seminar')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT,
  is_online BOOLEAN DEFAULT false,
  meeting_link TEXT,
  max_capacity INTEGER,
  registration_deadline TIMESTAMPTZ,
  is_exclusive BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  registered_by UUID REFERENCES users(id),
  ticket_number TEXT UNIQUE,
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered','attended','cancelled')),
  qr_code_url TEXT,
  registered_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id),
  title TEXT NOT NULL,
  type TEXT CHECK (type IN ('image','template','reel_idea','ad_copy','campaign','social_post')),
  content TEXT,
  file_url TEXT,
  tags TEXT[],
  ai_generated BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 7: UNIVERSITY APPLICATION MANAGEMENT
-- ============================================================

CREATE TABLE university_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  program_id UUID REFERENCES programs(id),
  office_id UUID REFERENCES offices(id),
  submitted_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft','submitted','gt_review','under_review',
    'docs_required','accepted','rejected','offer_issued','enrolled'
  )),
  intake_year INTEGER,
  intake_month TEXT,
  application_fee_paid BOOLEAN DEFAULT false,
  offer_letter_url TEXT,
  rejection_reason TEXT,
  notes TEXT,
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE application_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES university_applications(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 7: FINANCIAL MANAGEMENT SYSTEM
-- ============================================================

CREATE TABLE financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  student_id UUID REFERENCES students(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category TEXT NOT NULL,
  -- Income categories: consultation_fee, application_fee, visa_fee, service_fee, commission
  -- Expense categories: rent, salary, utilities, marketing, travel, supplies, other
  amount NUMERIC(12, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  exchange_rate NUMERIC(10, 4) DEFAULT 1,
  amount_in_usd NUMERIC(12, 2),
  payment_date DATE NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash','bank_transfer','mobile_banking','card','other')),
  reference_number TEXT,
  description TEXT,
  receipt_url TEXT,
  recorded_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id),
  university_id UUID REFERENCES universities(id),
  student_id UUID REFERENCES students(id),
  application_id UUID REFERENCES university_applications(id),
  amount NUMERIC(12, 2),
  currency TEXT DEFAULT 'USD',
  commission_rate NUMERIC(5, 2),   -- percentage
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','invoiced','paid','disputed')),
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 8: SUBSCRIPTION & BILLING (Multi-Tenant SaaS)
-- ============================================================

CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,              -- 'GO', 'UP', 'MAX'
  price_per_period NUMERIC(10, 2),
  period_months INTEGER,           -- 4 months per billing
  student_quota_min INTEGER,
  student_quota_max INTEGER,
  staff_accounts INTEGER,
  features JSONB,                  -- Feature flags as JSON
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled','trial')),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  student_count INTEGER DEFAULT 0,
  payment_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PHASE 8: NOTIFICATION SYSTEM (Multi-Channel)
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id),
  type TEXT NOT NULL,   -- 'application_update','document_issue','admission_result','payment_alert','task_due'
  title TEXT NOT NULL,
  body TEXT,
  data JSONB,           -- Entity references (student_id, application_id etc.)
  channels TEXT[],      -- ['in_app', 'email', 'sms', 'whatsapp']
  is_read BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 🔐 RBAC & Multi-Tenant Rules (ENFORCED IN ALL CODE)

### Role Definitions

| Role Slug          | Display Name        | Access Level             |
|--------------------|---------------------|--------------------------|
| `ceo`              | CEO                 | Super Admin (all offices)|
| `coo`              | COO                 | Super Admin (all offices)|
| `it_manager`       | IT Manager          | Super Admin (all offices)|
| `office_manager`   | Office Manager      | Own office, most actions |
| `senior_counselor` | Senior Counselor    | Own office, students only|
| `counselor`        | Counselor           | Own office, assigned only|
| `receptionist`     | Receptionist        | Own office, limited write|

### Multi-Tenant Rules (EVERY AI AGENT MUST FOLLOW)

```js
// ✅ CORRECT — always filter by office_id
const { data } = await supabase
  .from('students')
  .select('*')
  .eq('office_id', user.office_id);

// ❌ WRONG — never query without tenant filter (unless super admin)
const { data } = await supabase.from('students').select('*');

// ✅ CORRECT — super admin check before cross-office query
if (isSuperAdmin(user.role)) {
  const { data } = await supabase.from('students').select('*');
} else {
  const { data } = await supabase.from('students').select('*').eq('office_id', user.office_id);
}
```

### RLS Template for New Tables

```sql
-- Add RLS to every new table with office_id:
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;

CREATE POLICY "[table]_tenant_isolation" ON [table_name]
  FOR ALL USING (
    office_id = (SELECT office_id FROM users WHERE id = auth.uid())
    OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
  );
```

---

## 🌐 API Route Design Standards

All API routes live in `src/app/api/`. Follow this pattern exactly:

```js
// File: src/app/api/[module]/route.js

import { createServerSupabase } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const supabase = await createServerSupabase();
    
    // 1. Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get user profile + office_id
    const { data: profile } = await supabase
      .from('users')
      .select('id, role, office_id')
      .eq('id', user.id)
      .single();

    // 3. Build query with tenant filter
    let query = supabase.from('[table]').select('*');
    if (!['ceo','coo','it_manager'].includes(profile.role)) {
      query = query.eq('office_id', profile.office_id);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error) {
    console.error('[API Error]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('users')
      .select('id, role, office_id')
      .eq('id', user.id)
      .single();

    const body = await request.json();

    // Always inject office_id and created_by
    const record = {
      ...body,
      office_id: profile.office_id,
      created_by: user.id,
    };

    const { data, error } = await supabase.from('[table]').insert(record).select().single();
    if (error) throw error;

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## 🎨 UI/UX Coding Standards

### Component Template

```jsx
// File: src/components/[module]/ComponentName.jsx
'use client'; // Only if using hooks/browser APIs

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function ComponentName({ prop1, prop2 }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const { data, error } = await supabase
      .from('table_name')
      .select('*');
    if (!error) setData(data);
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="bg-surface-2 rounded-lg p-6 border border-white/5">
      {/* component content */}
    </div>
  );
}
```

### Standard CSS Class Patterns

```jsx
// Card container
<div className="bg-surface-2 rounded-lg border border-white/5 p-6">

// Glassmorphism card (premium)
<div className="bg-glass backdrop-blur-md border border-gold/10 rounded-lg p-6 shadow-gold">

// Primary button (gold CTA)
<button className="bg-gold hover:bg-gold-light text-navy font-semibold px-4 py-2 rounded transition-all">

// Secondary/ghost button
<button className="border border-gold/30 text-gold hover:bg-gold/10 px-4 py-2 rounded transition-all">

// Danger button
<button className="bg-danger hover:bg-red-600 text-white px-4 py-2 rounded transition-all">

// Input field
<input className="bg-surface-3 border border-white/10 rounded px-3 py-2 text-text placeholder:text-text-dim focus:outline-none focus:border-gold/50 w-full">

// Badge variants
<span className="bg-success/20 text-success px-2 py-0.5 rounded text-xs font-medium">Active</span>
<span className="bg-warning/20 text-warning px-2 py-0.5 rounded text-xs font-medium">Pending</span>
<span className="bg-danger/20 text-danger px-2 py-0.5 rounded text-xs font-medium">Rejected</span>

// Table
<table className="w-full">
  <thead>
    <tr className="border-b border-white/10">
      <th className="text-left py-3 px-4 text-text-muted text-sm font-medium">Column</th>
    </tr>
  </thead>
  <tbody>
    <tr className="border-b border-white/5 hover:bg-surface-3 transition-colors">
      <td className="py-3 px-4 text-text">Value</td>
    </tr>
  </tbody>
</table>
```

### Typography Standards

```jsx
// Page title
<h1 className="font-display text-2xl font-bold text-text">Page Title</h1>

// Section heading
<h2 className="font-display text-xl font-semibold text-text">Section</h2>

// Body text
<p className="text-text text-sm leading-relaxed">Content</p>

// Muted/label text
<p className="text-text-muted text-sm">Label or secondary info</p>

// Stat/number
<span className="font-display text-3xl font-bold text-gold">1,234</span>
```

---

## 📐 Development Phases — Detailed Plan

---

### ✅ PHASE 1–4: COMPLETE (Foundation + Core CRM)

All base infrastructure, authentication, student management, pipeline, chat, CCTV, HR, and reports are live. See `PHASE_3_DEPLOYMENT_GUIDE.md` and `PHASE_4_COMPLETE_28_TESTS.md` for details.

---

### ✅ PHASE 5: GT AI PLATFORM (COMPLETE)

**Goal**: Build the AI assistance system embedded into the CRM.

**Estimated Effort**: 3–4 weeks

#### 5.1 — OpenRouter AI Client Setup

**File to create**: `src/lib/ai/openrouter.js`

```js
// Universal AI client using OpenRouter
const OPENROUTER_BASE = 'https://openrouter.ai/api/v1';

export const AI_MODELS = {
  GPT4O: 'openai/gpt-4o',
  CLAUDE_SONNET: 'anthropic/claude-3.5-sonnet',
  GEMINI_PRO: 'google/gemini-pro-1.5',
  DEEPSEEK: 'deepseek/deepseek-chat',
  LLAMA: 'meta-llama/llama-3.1-70b-instruct',
};

export async function generateAI({ model, systemPrompt, userPrompt, maxTokens = 2000 }) {
  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
    }),
  });
  const data = await response.json();
  return data.choices[0].message.content;
}
```

**Add to `.env.local`**:
```
OPENROUTER_API_KEY=your_key_here
```

#### 5.2 — SOP / Study Plan / Self-Introduction Generator

**Files**:
- `src/app/ai/sop-generator/page.jsx` — UI
- `src/app/api/ai/sop/route.js` — API endpoint

**API Logic**:
1. Accept `student_id` + `document_type` (sop / study_plan / self_intro) + `target_university` + `model`
2. Load student profile from Supabase
3. Build context prompt from student data (name, academic background, IELTS, target university, target program)
4. Call OpenRouter `generateAI()`
5. Save result to `ai_generations` table
6. Return generated text

**UI Requirements**:
- Student selector dropdown (search by name)
- Document type selector (SOP / Study Plan / Self Introduction)
- Target university & program input
- Model selector (GPT-4o / Claude / Gemini)
- "Generate" button with loading spinner
- Editable output text area (TipTap rich text editor)
- "Save" + "Export as PDF" + "Export as DOCX" buttons
- Generation history sidebar

#### 5.3 — Resume / CV / Cover Letter Builder

**Files**:
- `src/app/ai/resume-builder/page.jsx`
- `src/app/api/ai/resume/route.js`

**API Logic**: Same pattern as SOP. Load student data → build resume prompt → generate → save.

**Resume Output Sections**:
- Personal Info, Education History, Work Experience, Skills, IELTS/Language Scores, Achievements, References

#### 5.4 — Student Advisor AI

**Files**:
- `src/app/ai/advisor/page.jsx`
- `src/app/api/ai/advisor/route.js`

**Features**:
- Input: student academic profile, budget, preferred country, career goal
- Output: Top 5 university recommendations with reasoning, scholarship opportunities, program suggestions
- Conversational chat interface (multi-turn)

#### 5.5 — AI Document Analysis System

**Files**:
- `src/app/ai/document-analysis/page.jsx`
- `src/app/api/ai/analyze-documents/route.js`
- `src/lib/ai/documentAnalyzer.js`

**Workflow**:
1. User selects student → system lists all uploaded documents
2. For each document: OCR extraction via Vision AI (OpenAI/Claude vision)
3. Extract: Name, DOB, Passport No, National ID, Academic info
4. Cross-document comparison: detect name/date/number mismatches
5. Generate Error Report + Risk Score (0–100) + Missing Documents list
6. Save to `ai_document_analyses` table
7. Display visual report with highlighted errors

**Document Types to Support**:
Passport, SSC Certificate, HSC Certificate, Bachelor Degree, Transcript, Birth Certificate, National ID, Family Certificate, Bank Statement, Income Certificate, TIN Certificate, Trade License, NOC, Police Clearance

#### 5.6 — Human Document Review Module

**Files**:
- `src/app/document-review/page.jsx`
- `src/app/api/document-review/route.js`

**Workflow**: GT Expert Counselors review student files → add review notes → mark errors → approve/reject → system notifies agency.

**UI**: Split-screen (document viewer left, review form right), error annotation tools.

#### 5.7 — Environment Variables for Phase 5

```bash
OPENROUTER_API_KEY=           # Required for all AI features
OPENAI_API_KEY=               # Direct OpenAI access (for vision/OCR)
ANTHROPIC_API_KEY=            # Direct Claude access (backup)
```

---

### ✅ PHASE 6: MARKETING, EVENTS & GT SOCIAL (COMPLETE)

**Goal**: Marketing tools, event management, and social media assets.

**Estimated Effort**: 2–3 weeks

#### 6.1 — Events & Expo Module

**Files**:
- `src/app/events/page.jsx` — Event list + calendar view
- `src/app/events/[id]/page.jsx` — Event detail + registration
- `src/app/api/events/route.js` — CRUD
- `src/app/api/events/[id]/register/route.js` — Registration

**Features**:
- Create events (seminar, expo, webinar, workshop)
- Event calendar view + list view
- Student registration + QR ticket generation (using `qrcode` npm package — already installed)
- Attendance tracking
- Exclusive invitation system for premium agency students
- Email invitations via Resend

#### 6.2 — Marketing Support Module

**Files**:
- `src/app/marketing/page.jsx`
- `src/app/api/ai/marketing/route.js`

**Features**:
- AI ad copy generation (Facebook, Instagram, LinkedIn)
- Campaign planner with target audience definition
- Social media content calendar
- AI image generation prompt builder
- Campaign performance tracking (manual entry)

#### 6.3 — GT Social Module (Full)

**Files**: `src/app/social/page.jsx`

**Features**:
- Marketing asset library (templates, images, reel ideas)
- Success story promotion builder
- Agency featured listing management
- Content templates for WhatsApp, Facebook, Instagram

---

### ✅ PHASE 7: UNIVERSITY APPLICATION & FINANCIAL MANAGEMENT (COMPLETE)

**Goal**: Complete university application workflow + financial management system.

**Estimated Effort**: 3–4 weeks

#### 7.1 — University Application Management

**Files**:
- `src/app/applications/page.jsx` — Application list
- `src/app/applications/[id]/page.jsx` — Application detail
- `src/app/api/applications/route.js`
- `src/app/api/applications/[id]/status/route.js` — Status changes

**Application Status Pipeline**:
```
Draft → Submitted (Agency) → GT Review → Under Review (University)
→ Docs Required → Accepted → Offer Issued → Enrolled
                           → Rejected
```

**Features**:
- Agency submits application → GT Group reviews → forwards to University
- Document checklist per application
- Offer letter upload by university
- Status history timeline
- Email notifications on every status change
- University dashboard (via `/portal` route, extended)

#### 7.2 — Financial Management System

**Files**:
- `src/app/finance/page.jsx` — Finance dashboard
- `src/app/finance/income/page.jsx` — Income management
- `src/app/finance/expenses/page.jsx` — Expense management
- `src/app/finance/commissions/page.jsx` — Commission tracking
- `src/app/api/finance/route.js`

**Features**:
- Income tracking (by category, student, counselor)
- Expense tracking (office expenses, salaries, marketing)
- Commission tracking from universities
- Revenue dashboards: Daily / Weekly / Monthly / Yearly
- Multi-currency support (BDT, LKR, KRW, VND, USD)
- PDF + Excel export (using jsPDF + ExcelJS — already installed)
- Charts: Revenue Growth, Expense Analysis, Profit/Loss (Recharts — already installed)

#### 7.3 — Multi-Channel Notification System

**Files**:
- `src/app/api/notifications/route.js`
- `src/lib/notificationService.js`

**Channels**:
- **In-App**: Real-time via Supabase Realtime + `notifications` table
- **Email**: Resend API (already configured)
- **SMS**: Twilio (Phase 7 add-on, requires `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`)
- **WhatsApp**: WhatsApp Business API (Phase 7 add-on)

**Notification Triggers**:

| Event                    | Recipients              | Channels            |
|--------------------------|-------------------------|---------------------|
| Application status change| Agency owner + student  | In-App + Email      |
| Document issue detected  | Agency counselor        | In-App + Email      |
| Offer letter received    | Agency + Student        | In-App + Email + SMS|
| Payment alert            | Office manager          | In-App              |
| Task due                 | Assigned staff          | In-App + Email      |
| New student assigned     | Counselor               | In-App + Email      |

---

### ✅ PHASE 8: SUBSCRIPTION BILLING & ADMIN PANEL (COMPLETE)

**Goal**: SaaS subscription system + Super Admin control panel.

**Estimated Effort**: 3 weeks

#### 8.1 — Subscription Plans Implementation

**Plans** (from `newupdate-crmproject.md`):

| Plan   | Price          | Students  | Staff | CCTV Cameras | Key AI Feature          |
|--------|----------------|-----------|-------|--------------|-------------------------|
| **GO** | $79 / 4 months | 1–7       | 2     | None         | Human Doc Review        |
| **UP** | $139 / 4 months| 5–13      | 5     | 6 cameras    | AI Doc Analysis (10)    |
| **MAX**| $199 / 4 months| 8–25      | 13    | 15 cameras   | AI Doc Analysis (25)    |

**University Portal**: Free 6 months → $149/month

**Files**:
- `src/app/billing/page.jsx` — Billing dashboard
- `src/app/billing/plans/page.jsx` — Plan selection
- `src/app/api/billing/route.js`

**Implementation Steps**:
1. Seed `subscription_plans` table with GO/UP/MAX plans
2. When new agency registers → assign plan → create `tenant_subscriptions` record
3. Feature flags from plan restrict: student count, staff count, CCTV camera count, AI access
4. Middleware checks subscription status on protected routes
5. Payment integration: Manual (invoice upload) first, Stripe later

#### 8.2 — Feature Flag System

**File**: `src/lib/featureFlags.js`

```js
export async function checkFeature(officeId, feature) {
  const { data: sub } = await supabase
    .from('tenant_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('office_id', officeId)
    .eq('status', 'active')
    .single();

  if (!sub) return false;
  return sub.subscription_plans.features[feature] === true;
}
```

#### 8.3 — Super Admin Dashboard (GT Group Internal)

**File**: `src/app/admin/page.jsx`

**Features**:
- All tenant/office overview
- Subscription management for all agencies
- System health monitoring
- Revenue analytics across all tenants
- User management across all offices
- CCTV global monitoring view
- AI usage stats and token consumption tracking

---

### ✅ PHASE 9: INFRASTRUCTURE & NEXT.JS 15 UPGRADE (COMPLETE)

**Goal**: Production infrastructure, CI/CD, upgrade to Next.js 15.

**Estimated Effort**: 2 weeks

#### 9.1 — GitHub Actions CI/CD Pipeline

**File**: `.github/workflows/deploy.yml`

```yaml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run lint
      - run: npm run build
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

#### 9.2 — Next.js 15 Migration Checklist

When upgrading from Next.js 14 to 15:
- [ ] Update `next` package: `npm install next@15 react@19 react-dom@19`
- [ ] Update `@supabase/ssr` to latest version
- [ ] Convert async `cookies()` usage (breaking change in Next.js 15)
- [ ] Review `params` in page components (now async in Next.js 15)
- [ ] Test all API routes for compatibility
- [ ] Update `eslint-config-next` to `15.x`

#### 9.3 — Redis Cache Integration (Upstash)

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

**Cache targets**:
- User profile + permissions (5 min TTL)
- Dashboard KPI aggregates (1 min TTL)
- AI generation history (session TTL)
- Translation cache (24 hr TTL)

#### 9.4 — Docker Compose Production

**File**: `docker-compose.prod.yml` (update existing)

```yaml
services:
  nextjs:
    build: .
    ports: ["3005:3005"]
    environment:
      - NODE_ENV=production
  cctv-tracker:
    build: ./services/cctv_tracker
    ports: ["5001:5001"]
  libretranslate:
    image: libretranslate/libretranslate:latest
    ports: ["5000:5000"]
    environment:
      - LT_LOAD_ONLY=en,ko,bn,vi,si
  caddy:
    image: caddy:2
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
```

---

### ✅ PHASE 10: MOBILE APP (REACT NATIVE + EXPO) (COMPLETE)

**Goal**: Cross-platform mobile CRM app for iOS and Android.

**Estimated Effort**: 6–8 weeks (separate repository)

#### Tech Stack (Mobile)

| Layer         | Technology              |
|---------------|-------------------------|
| Framework     | React Native + Expo SDK 51+ |
| Navigation    | Expo Router v3 (file-based) |
| State         | Zustand + React Query   |
| Database      | Same Supabase backend   |
| Auth          | Supabase Auth (Expo)    |
| Push Notifs   | Expo Push Notifications |
| Offline       | React Native MMKV       |
| Charts        | Victory Native          |

#### Mobile Features Priority

1. Student list + profile view (read-only)
2. Pipeline Kanban (view + status change)
3. Appointments + calendar
4. Push notifications for status changes
5. Chat (DMs + groups)
6. Student document upload via camera
7. QR code scanner for events

---

## 🔄 Migration Database Plan

When adding new tables, always create a numbered migration file:

```bash
# Migration file naming convention:
supabase/migrations/NNN_description.sql

# Current highest: 042_chat_storage_setup.sql
# Next migrations:
043_ai_platform_tables.sql       # Phase 5 tables
044_events_marketing_tables.sql  # Phase 6 tables
045_applications_finance.sql     # Phase 7 tables
046_billing_notifications.sql    # Phase 8 tables
```

**Migration Template**:

```sql
-- Migration: 043_ai_platform_tables.sql
-- Description: GT AI Platform tables for SOP, document analysis, human review
-- Phase: 5
-- Date: 2026-xx-xx

BEGIN;

-- Create tables here...

-- Enable RLS on all new tables
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE human_document_reviews ENABLE ROW LEVEL SECURITY;

-- Add RLS policies...
CREATE POLICY "ai_generations_tenant" ON ai_generations
  FOR ALL USING (
    office_id = (SELECT office_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
  );

COMMIT;
```

---

## 🧪 Testing Standards

### Unit Testing Approach

- **Framework**: Jest + React Testing Library
- **Location**: `__tests__/` in each module directory
- **Coverage Target**: 80% for all new Phase 5+ code

### Integration Testing

- **Tool**: Playwright or Cypress (E2E)
- **Coverage**: All critical user flows (login, add student, change pipeline stage, generate AI document, submit application)

### AI Model Testing

- Test each AI generation type with 3 sample student profiles
- Verify output quality for SOP, Resume, Advisor recommendations
- Test document analysis accuracy against known-good documents
- Monitor token usage via `ai_generations` table

---

## 📋 Environment Variables — Complete Reference

```bash
# ===== SUPABASE (Required) =====
NEXT_PUBLIC_SUPABASE_URL=https://kjppkkumublhiwzwufhe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:PASSWORD@db.kjppkkumublhiwzwufhe.supabase.co:5432/postgres

# ===== APP CONFIG (Required) =====
NEXT_PUBLIC_APP_URL=http://localhost:3005    # Production: https://gtgroupcrmproject.vercel.app

# ===== EMAIL (Required for email features) =====
RESEND_API_KEY=re_...

# ===== GOOGLE OAUTH (Required for Gmail integration) =====
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=http://localhost:3005/api/auth/google-oauth-callback

# ===== CCTV TRACKER (Required for CCTV module) =====
CCTV_TRACKER_URL=http://127.0.0.1:5001      # Production: internal URL
CCTV_ENCRYPTION_KEY=abcdefghijklmnopqrstuvwxyz123456  # 32 chars
FFMPEG_PATH=C:\ffmpeg\...\bin\ffmpeg.exe

# ===== TRANSLATION (Required for chat translation) =====
NEXT_PUBLIC_LIBRETRANSLATE_URL=http://localhost:5000
NEXT_PUBLIC_DEFAULT_TRANSLATION_ENGINE=libretranslate
NEXT_PUBLIC_ENABLE_CHAT_TRANSLATION=true

# ===== AI PLATFORM (Phase 5 — New) =====
OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...                       # For vision/OCR document analysis
ANTHROPIC_API_KEY=sk-ant-...               # Direct Claude (backup)

# ===== CACHE (Phase 9 — New) =====
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# ===== NOTIFICATIONS (Phase 7 — New) =====
TWILIO_ACCOUNT_SID=                         # For SMS notifications
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# ===== BILLING (Phase 8 — New) =====
STRIPE_SECRET_KEY=sk_...                    # Optional: for Stripe payment integration
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
```

---

## 🛤️ Development Roadmap Summary

```
PHASE 1–4   ✅ COMPLETE
────────────────────────────────────────────────────────
Foundation, Auth, Students, Pipeline, Chat, CCTV, HR, Reports

PHASE 5     🚧 NEXT — GT AI PLATFORM (3–4 weeks)
────────────────────────────────────────────────────────
OpenRouter Client → SOP Generator → Resume Builder →
Student Advisor AI → AI Document Analysis → Human Review

PHASE 6     🔜 AFTER PHASE 5 — MARKETING & EVENTS (2–3 weeks)
────────────────────────────────────────────────────────
Events & Expo Module → Marketing AI Tools → GT Social Full

PHASE 7     🔜 UNIVERSITY APPLICATIONS & FINANCE (3–4 weeks)
────────────────────────────────────────────────────────
Application Pipeline → Financial Management →
Multi-Channel Notifications → Commission Tracking

PHASE 8     🔜 BILLING & ADMIN (3 weeks)
────────────────────────────────────────────────────────
Subscription Plans (GO/UP/MAX) → Feature Flags →
Super Admin Panel → Usage Analytics

PHASE 9     🔜 INFRASTRUCTURE (2 weeks)
────────────────────────────────────────────────────────
GitHub Actions CI/CD → Next.js 15 Upgrade →
Redis Cache → Production Docker Compose

PHASE 10    🔜 MOBILE APP (6–8 weeks, separate repo)
────────────────────────────────────────────────────────
React Native + Expo → iOS + Android → Push Notifications
```

---

## ⚡ Quick Start for AI Agents

If you are an AI agent implementing a task in this project, follow these steps:

### Step 1: Understand Context
- Read `TECH_STACK.md` → full technology reference
- Read `newupdate-crmproject.md` → product requirements
- Read `implementation_plan.md` → original technical decisions
- Read this file → master development plan

### Step 2: Determine Phase
- Check which phase the task belongs to (5, 6, 7, 8, 9, or 10)
- Read the relevant phase section above

### Step 3: Follow Coding Conventions
- Use the API route template from this document
- Use the component template from this document
- Apply the CSS class patterns from this document
- Always add `office_id` to new data records
- Always add RLS policies to new tables

### Step 4: Create Migration (if DB changes)
- Create `supabase/migrations/0NN_description.sql`
- Follow the migration template from this document
- Number sequentially from 043 onwards

### Step 5: Update Documentation
- Update this plan to mark tasks as ✅ complete
- Add new environment variables to the reference table

---

## 🔖 Key File References

| Purpose                      | File                                   |
|------------------------------|----------------------------------------|
| Technology reference          | `TECH_STACK.md`                        |
| Product requirements          | `newupdate-crmproject.md`              |
| Original technical plan       | `implementation_plan.md`              |
| Phase 2 API reference         | `PHASE_2_API_DEVELOPER_REFERENCE.md`  |
| Phase 3 deployment guide      | `PHASE_3_DEPLOYMENT_GUIDE.md`         |
| Phase 4 test suite            | `PHASE_4_COMPLETE_28_TESTS.md`        |
| API routes reference          | `API_REFERENCE.md`                    |
| Chat system plan              | `chat_system_master_plan.md`          |
| CCTV tracking plan            | `cctv_employee_tracking_daily_auto_system_report_master_plan.md` |
| RBAC permissions              | `src/lib/permissions.js`             |
| Supabase browser client       | `src/lib/supabase.js`                |
| Supabase server client        | `src/lib/supabase-server.js`         |
| Auth middleware               | `src/middleware.js`                  |

---

*Document Version: 1.0 | Created: June 2026 | By: Antigravity AI Agent*
*Next Review: After Phase 5 completion*
