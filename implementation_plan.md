# GT Group Study Abroad CRM — FINAL Implementation Plan (v3)

## Overview

A **production-grade, full-stack, international CRM system** for GT Group Study Abroad Consultancy. Staff across four offices (South Korea, Bangladesh, Sri Lanka, Vietnam) access a single secure online platform — with strict role-based permissions, real-time data, document storage, payment tracking, and email notifications.

---

## ✅ All Decisions Confirmed

| # | Decision | Answer |
|---|---|---|
| 1 | Authentication | ✅ Login with username & password |
| 2 | Database | ✅ Supabase (PostgreSQL) — project already exists |
| 3 | Deployment | ✅ `gtgroupcrmproject.vercel.app` (Vercel) |
| 4 | Multi-office Access | ✅ CEO/COO/IT Manager full access; staff = own office only |
| 5 | Destinations | ✅ Single "Destinations" list — add/edit/delete by Super Admins only |
| 6 | Document Storage | ✅ Staff can upload student documents (Supabase Storage) |
| 7 | Payment Tracking | ✅ Staff update all student payment information |
| 8 | Email Notifications | ✅ Alerts for new lead assignments & appointment reminders |

---

## Infrastructure

```
┌─────────────────────────────────────────────────────────────────────┐
│  FRONTEND                     BACKEND / SERVICES                    │
│  Next.js 14 (App Router)      Supabase Cloud                        │
│  gtgroupcrmproject.vercel.app ├── PostgreSQL Database               │
│                               ├── Supabase Auth (JWT sessions)      │
│                               ├── Row Level Security (RLS)          │
│                               ├── Supabase Storage (documents)      │
│                               ├── Edge Functions (email triggers)   │
│                               └── Realtime (live updates)           │
│                                                                     │
│  EMAIL SERVICE                                                      │
│  Resend API (via Supabase Edge Functions)                           │
│  ├── New lead assignment alerts                                     │
│  └── Appointment reminder emails                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Supabase Project (Already Configured)
- **Project URL**: `https://kjppkkumublhiwzwufhe.supabase.co`
- **Publishable Key**: `sb_publishable_KROQNRANCDiddUobvt03yw_Kd0SlEqA`
- **Project Ref**: `kjppkkumublhiwzwufhe`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| Styling | Vanilla CSS + CSS Modules (GT brand) |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| File Storage | Supabase Storage |
| Access Control | Row Level Security (RLS) |
| Charts & Analytics | Chart.js / Recharts |
| Email Service | Resend API via Supabase Edge Functions |
| Icons | Lucide React |
| Fonts | Google Fonts — Inter |
| Deployment | Vercel (`gtgroupcrmproject.vercel.app`) |

---

## Brand Design System

| Token | Value |
|---|---|
| `--color-gold` | `#C9A227` |
| `--color-gold-light` | `#F0C040` |
| `--color-dark` | `#1A1A2E` |
| `--color-surface` | `#16213E` |
| `--color-card` | `#0F3460` |
| `--color-charcoal` | `#3A3A3A` |
| `--color-text` | `#E8E8E8` |
| Font | Inter (300, 400, 500, 600, 700) |
| Theme | Dark navy + gold — premium feel |

---

## User Roles & Permission Matrix

### Roles

```
SUPER ADMIN — Full system access (all offices, all data, all settings)
├── CEO
├── COO  
└── IT Manager

OFFICE STAFF — Own office data only (permissions configurable by Super Admins)
├── Office Manager
├── Senior Counselor
├── Counselor
└── Receptionist
```

### Default Permission Matrix

| Feature | CEO/COO/IT | Office Manager | Counselor | Receptionist |
|---|---|---|---|---|
| View all offices | ✅ | ❌ Own only | ❌ Own only | ❌ Own only |
| Add Students | ✅ | ✅ | ✅ | ✅ |
| Edit Students | ✅ | ✅ | ✅ | Configurable |
| Delete Students | ✅ | Configurable | ❌ | ❌ |
| Upload Documents | ✅ | ✅ | ✅ | ✅ |
| View Documents | ✅ | ✅ | ✅ | ✅ |
| Update Payments | ✅ | ✅ | ✅ | Configurable |
| View Reports | ✅ All | ✅ Own | Configurable | ❌ |
| Manage Pipeline | ✅ | ✅ | ✅ | View only |
| Manage Appointments | ✅ | ✅ | ✅ | ✅ |
| Manage Destinations | ✅ | ❌ | ❌ | ❌ |
| Manage Universities | ✅ | ❌ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| System Settings | ✅ Full | Own office | ❌ | ❌ |

> Super Admins can customize each role's default permissions from **Settings → Permissions**.

---

## 10 Application Modules

### 1. 🔐 Authentication (Login)
- GT Group branded login page (dark navy + gold logo)
- Email + password authentication via Supabase Auth
- "Remember me" / persistent sessions
- Secure JWT token management
- Auto-redirect after login based on role
- Password reset via email link
- Session expiry & forced logout

---

### 2. 🏠 Dashboard (Role-Aware)
**Super Admin View:**
- Global KPI cards: Total Students (all offices), Active Leads, Visa Approvals, Total Enrolled, Total Revenue
- Office performance comparison bar chart
- Line chart: Monthly leads trend across all offices
- Map-style office cards (South Korea 🇰🇷, Bangladesh 🇧🇩, Sri Lanka 🇱🇰, Vietnam 🇻🇳)

**Staff View (own office only):**
- Office KPI cards: My Students, Active Leads, This Month Enrollments, Revenue
- Lead source pie chart (Facebook, Referral, Walk-in, Website, WhatsApp, Other)
- Destination popularity chart

**Both Views:**
- Recent activity feed (student added, status changed, doc uploaded)
- Today's appointments widget
- Overdue follow-ups alert
- Quick actions: + Add Student, + Schedule Appointment

---

### 3. 👥 Students / Leads Management

**Student Profile Fields:**
```
PERSONAL INFORMATION
├── Full Name (First + Last)
├── Date of Birth
├── Gender
├── Nationality
├── Passport Number
└── Passport Expiry Date

CONTACT INFORMATION
├── Email Address
├── Phone Number
├── WhatsApp Number
└── Current Address

ACADEMIC BACKGROUND
├── Highest Education Level
├── Institution Name
├── GPA / Percentage
├── Graduation Year
├── IELTS Score (Overall + per band)
├── TOEFL Score
└── Other English Test (PTE, Duolingo)

STUDY ABROAD PREFERENCES
├── Target Destination (from Destinations list)
├── Target University
├── Target Course / Program
└── Preferred Intake (March / September / October / January)

CRM INFORMATION
├── Lead Source (Facebook, Referral, Walk-in, Website, WhatsApp, Other)
├── Assigned Counselor
├── Office
├── Pipeline Status
├── Priority (High / Medium / Low)
└── Created Date / Last Updated
```

**Features:**
- Full CRUD (add, view, edit, delete)
- Advanced search (name, email, phone, passport)
- Multi-filter: office, status, counselor, destination, lead source, date range
- Bulk actions: reassign counselor, change status, export selection
- Import students from CSV
- Export to CSV / PDF
- Student notes & interaction log (every action timestamped)
- Profile page with tabs: Overview | Documents | Payments | Notes | History

---

### 4. 📋 Application Pipeline (Kanban Board)

**Pipeline Stages:**
```
New Lead  →  Initial Consultation  →  Documents Collecting  →
Application Submitted  →  Offer Received  →  Visa Applied  →
Visa Approved  →  Enrolled ✅    |   Rejected ❌   |   Deferred ⏸
```

**Features:**
- Visual Kanban board with drag-and-drop cards
- Student card shows: name, destination flag, university, counselor, days in stage
- Color-coded by destination country 🇰🇷🇯🇵🇨🇳
- Stage count badges
- Filter by: office (Super Admin), counselor, destination, date
- Status change logs every pipeline move with reason + timestamp
- Super Admin sees all offices; staff see own office

---

### 5. 📅 Appointments & Follow-ups

**Appointment Types:**
- Initial Consultation
- Document Review
- Application Review
- Mock Interview / Visa Preparation
- Follow-up Call
- Walk-in Meeting

**Features:**
- Calendar view (monthly / weekly / daily)
- Linked to student profile
- Status: Scheduled / Completed / Cancelled / No-show
- Overdue & today's appointment highlights
- Upcoming follow-ups widget on dashboard
- Email reminder sent automatically (24hrs before appointment)

---

### 6. 🗺️ Destinations Management

**Managed by Super Admins only (CEO / COO / IT Manager):**
- Add new destination country
- Edit destination details (country name, flag emoji, notes, status: Active/Inactive)
- Delete destination
- Staff can VIEW destinations but cannot add/edit/delete
- Used as a dropdown in student profiles and filters

**Default Destinations (pre-seeded):**
| # | Country | Flag | Status |
|---|---|---|---|
| 1 | South Korea | 🇰🇷 | Active |
| 2 | Japan | 🇯🇵 | Active |
| 3 | China | 🇨🇳 | Active |
| 4 | USA | 🇺🇸 | Active |
| 5 | United Kingdom | 🇬🇧 | Active |
| 6 | Australia | 🇦🇺 | Active |
| 7 | Germany | 🇩🇪 | Active |
| 8 | Finland | 🇫🇮 | Active |

---

### 7. 🏫 Universities & Programs

**Managed by Super Admins only:**
- University database linked to Destinations
- Per university: name, country, city, ranking, website, logo
- Programs per university: course name, degree level (Bachelor/Master/PhD), tuition fee, currency, intake months, duration, entry requirements

---

### 8. 💰 Payments & Revenue Tracking

**Staff can update all student payment information:**

**Payment Categories per Student:**
- Consultation Fee
- Application Processing Fee
- Visa Application Fee
- Courier / Documentation Fee
- University Application Fee
- Other / Miscellaneous

**Per Payment Record:**
- Amount + Currency (BDT / LKR / KRW / VND / USD)
- Payment Date
- Payment Method (Cash / Bank Transfer / Mobile Banking)
- Status (Paid / Pending / Partial / Refunded)
- Receipt Number
- Notes / Remarks
- Recorded by (staff member + timestamp)

**Revenue Reports (Super Admin):**
- Total revenue by office
- Monthly revenue trend
- Revenue by destination country
- Outstanding / pending payments

---

### 9. 📁 Document Management (Supabase Storage)

**Staff can upload documents per student:**

**Document Types:**
- Passport Copy
- Academic Transcripts
- Degree Certificate
- IELTS / TOEFL Certificate
- Birth Certificate
- Bank Statement
- Recommendation Letter
- University Offer Letter
- Visa Application Form
- Visa Approval / Rejection Letter
- Other

**Per Document:**
- Type, file upload (PDF/JPG/PNG, max 10MB)
- Upload date, uploaded by
- Status: Pending Review / Verified / Rejected
- Notes

**Storage:** Supabase Storage (organized by student ID folders)

---

### 10. 📊 Reports & Analytics

**Super Admin — All Offices:**
- Cross-office conversion funnel: Leads → Enrolled
- Monthly/quarterly/yearly comparison per office
- Revenue breakdown by office, counselor, destination
- Top performing counselors
- Lead source effectiveness
- Destination popularity trends
- Document completion rates

**Staff — Own Office:**
- Office conversion funnel
- My students: status breakdown
- Monthly enrollment stats
- Lead source analysis
- Payment collection summary

**Export:** All reports exportable as PDF

---

### ⚙️ Settings

| Section | Who Can Access | Features |
|---|---|---|
| Office Management | Super Admin | Add/edit/delete offices, assign managers |
| User Management | Super Admin | Add users, set role, assign office, reset password, activate/deactivate |
| Permission Control | Super Admin | Customize what each role can see/do per feature |
| Destinations | Super Admin | Add/edit/delete countries (linked to Module 6) |
| Universities | Super Admin | Manage university/program database |
| Pipeline Stages | Super Admin | Customize stage names and order |
| Email Notifications | Super Admin | Toggle notification types, email templates preview |
| General | Super Admin | CRM name, logo, timezone per office |

---

## 📧 Email Notification System

**Powered by:** Resend API via Supabase Edge Functions

| Trigger | Recipient | Email Content |
|---|---|---|
| New student assigned to counselor | Assigned Counselor | Student name, contact, intake details, link to profile |
| Student pipeline status changed | Assigned Counselor | Old status → New status, student name |
| Appointment scheduled | Counselor + Student | Date, time, type, location |
| Appointment reminder | Counselor | 24 hours before appointment |
| Document uploaded | Assigned Counselor | Document type, student name |
| Payment recorded | Office Manager | Student name, amount, payment type |

---

## Full Database Schema

```sql
-- OFFICES
CREATE TABLE offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- USERS (+ Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ceo','coo','it_manager','office_manager','senior_counselor','counselor','receptionist')),
  office_id UUID REFERENCES offices(id),
  phone TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ROLE PERMISSIONS
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  feature TEXT NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false
);

-- DESTINATIONS
CREATE TABLE destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL,
  flag_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- UNIVERSITIES
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  destination_id UUID REFERENCES destinations(id),
  city TEXT,
  ranking INTEGER,
  website TEXT,
  logo_url TEXT
);

-- PROGRAMS
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID REFERENCES universities(id),
  name TEXT NOT NULL,
  degree_level TEXT CHECK (degree_level IN ('Bachelor','Master','PhD','Diploma','Language')),
  tuition_fee NUMERIC,
  currency TEXT DEFAULT 'USD',
  duration_years NUMERIC,
  intake_months TEXT[],
  requirements TEXT
);

-- STUDENTS
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Personal
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  passport_number TEXT,
  passport_expiry DATE,
  -- Contact
  email TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT,
  -- Academic
  education_level TEXT,
  institution_name TEXT,
  gpa TEXT,
  graduation_year INTEGER,
  ielts_overall NUMERIC,
  ielts_listening NUMERIC,
  ielts_reading NUMERIC,
  ielts_writing NUMERIC,
  ielts_speaking NUMERIC,
  toefl_score INTEGER,
  other_test TEXT,
  other_test_score TEXT,
  -- Study Preferences
  target_destination_id UUID REFERENCES destinations(id),
  target_university_id UUID REFERENCES universities(id),
  target_program_id UUID REFERENCES programs(id),
  target_course_name TEXT,
  preferred_intake TEXT,
  -- CRM
  lead_source TEXT CHECK (lead_source IN ('Facebook','Instagram','Referral','Walk-in','Website','WhatsApp','LinkedIn','Other')),
  pipeline_status TEXT DEFAULT 'new_lead',
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  assigned_to UUID REFERENCES users(id),
  office_id UUID REFERENCES offices(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- PIPELINE HISTORY
CREATE TABLE pipeline_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- APPOINTMENTS
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES users(id),
  office_id UUID REFERENCES offices(id),
  type TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled','no_show')),
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- PAYMENTS
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id),
  category TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_date DATE,
  payment_method TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('paid','pending','partial','refunded')),
  receipt_number TEXT,
  notes TEXT,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DOCUMENTS
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected')),
  notes TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- INTERACTIONS / NOTES
CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  staff_id UUID REFERENCES users(id),
  type TEXT CHECK (type IN ('note','call','email','meeting','whatsapp','document','payment','status_change')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## Row Level Security (RLS) Rules

```sql
-- Staff can only SELECT students from their own office
CREATE POLICY "staff_own_office" ON students
  FOR SELECT USING (
    office_id = (SELECT office_id FROM users WHERE id = auth.uid())
    OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
  );

-- Same pattern applied to: documents, payments, appointments, interactions
```

---

## Project File Structure

```
d:\GT CRM WEB PROJECT\
├── package.json
├── next.config.js
├── .env.local                         # Supabase keys
├── .env.example
│
├── src/
│   ├── app/
│   │   ├── layout.jsx
│   │   ├── page.jsx                   # → redirects to /login or /dashboard
│   │   ├── login/page.jsx             # 🔐 Login
│   │   ├── dashboard/page.jsx         # 🏠 Dashboard
│   │   ├── students/
│   │   │   ├── page.jsx               # Students list
│   │   │   └── [id]/page.jsx          # Student profile (tabs)
│   │   ├── pipeline/page.jsx          # 📋 Kanban board
│   │   ├── appointments/page.jsx      # 📅 Calendar
│   │   ├── destinations/page.jsx      # 🗺️ Destinations
│   │   ├── universities/page.jsx      # 🏫 Universities
│   │   ├── reports/page.jsx           # 📊 Analytics
│   │   └── settings/
│   │       ├── page.jsx               # Settings hub
│   │       ├── users/page.jsx         # User management
│   │       ├── offices/page.jsx       # Office management
│   │       └── permissions/page.jsx   # Permission control
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   └── AuthGuard.jsx          # Protect all routes
│   │   ├── dashboard/
│   │   │   ├── KPICard.jsx
│   │   │   ├── OfficeStats.jsx
│   │   │   └── ActivityFeed.jsx
│   │   ├── students/
│   │   │   ├── StudentTable.jsx
│   │   │   ├── StudentForm.jsx        # Add/edit modal
│   │   │   ├── StudentProfile.jsx
│   │   │   ├── DocumentsTab.jsx
│   │   │   ├── PaymentsTab.jsx
│   │   │   └── NotesTab.jsx
│   │   ├── pipeline/
│   │   │   ├── KanbanBoard.jsx
│   │   │   └── KanbanCard.jsx
│   │   ├── appointments/
│   │   │   └── AppointmentCalendar.jsx
│   │   └── ui/
│   │       ├── Modal.jsx
│   │       ├── Button.jsx
│   │       ├── Badge.jsx
│   │       ├── Table.jsx
│   │       └── PermissionGate.jsx     # Hide UI by role
│   │
│   ├── lib/
│   │   ├── supabase.js               # Supabase browser client
│   │   ├── supabase-server.js        # Supabase server client
│   │   ├── auth.js                   # Auth helpers & session
│   │   └── permissions.js            # Role permission checks
│   │
│   └── styles/
│       ├── globals.css               # Brand tokens, reset
│       ├── login.module.css
│       ├── sidebar.module.css
│       ├── dashboard.module.css
│       ├── students.module.css
│       ├── pipeline.module.css
│       └── modals.module.css
│
├── supabase/
│   ├── migrations/                   # DB schema SQL files
│   └── functions/
│       └── send-email/               # Edge Function for Resend email
│
└── public/
    ├── logo-gt-group.png
    ├── logo-gt-bangladesh.png
    └── logo-gt-lanka.png
```

---

## Development Phases & Build Order

| Phase | Tasks |
|---|---|
| **Phase 1** — Foundation | Init Next.js project, install deps, connect Supabase, run DB migrations, set up RLS policies |
| **Phase 2** — Auth | Login page (GT branded), session management, AuthGuard HOC, role detection |
| **Phase 3** — Layout | Sidebar nav, header (user info, office badge), permission-aware nav items |
| **Phase 4** — Dashboard | KPI cards, charts (Chart.js), activity feed, office comparison (Super Admin) |
| **Phase 5** — Students | Student list table, add/edit form, full profile page with tabs |
| **Phase 6** — Pipeline | Kanban board, drag-drop status changes, pipeline history log |
| **Phase 7** — Documents & Payments | File upload to Supabase Storage, payment forms, receipt tracking |
| **Phase 8** — Appointments | Calendar view, form, reminder logic |
| **Phase 9** — Destinations, Universities, Reports, Settings | Remaining modules + permission control UI |
| **Phase 10** — Email + Deploy | Supabase Edge Function (Resend), Vercel deployment, seed demo data |

---

## Deployment Checklist

- [ ] Push code to GitHub repository
- [ ] Connect GitHub repo to Vercel project
- [ ] Add environment variables in Vercel dashboard:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `RESEND_API_KEY`
- [ ] Run Supabase migrations on production DB
- [ ] Create first Super Admin user (CEO account)
- [ ] Upload GT Group logos to Supabase Storage
- [ ] Seed initial offices, destinations, default permissions
- [ ] Deploy to `gtgroupcrmproject.vercel.app`

---

> ✅ **This is the FINAL plan. No further questions. Ready to build.**
