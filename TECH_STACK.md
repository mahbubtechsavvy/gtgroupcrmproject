# GT Group CRM — Technology Stack & Architecture Reference

> **Document Purpose**: This file is the single source of truth for technology decisions, architecture patterns, and development conventions. Any AI agent or developer onboarding to this project must read this file first.

---

## 📋 Project Identity

| Field              | Value                                                     |
|--------------------|-----------------------------------------------------------|
| **Project Name**   | GT Group CRM                                              |
| **Product Type**   | Multi-Tenant SaaS CRM + SFMS + AI Platform                |
| **Target Market**  | Study Abroad Agencies, Universities, Education Consultants|
| **Version**        | 0.1.0                                                     |
| **Repository**     | `d:\GT CRM WEB PROJECT\gtgroupcrmproject`                 |
| **Live URL**       | `gtgroupcrmproject.vercel.app`                            |
| **Supabase URL**   | `https://kjppkkumublhiwzwufhe.supabase.co`                |
| **Default Port**   | `3005` (Next.js) + `5001` (Python CCTV Tracker)           |

---

## 🏗️ System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│  CLIENT LAYER                                                    │
│  Browser (React 18 + Next.js 14 App Router)                      │
│  Port: 3005 (dev)  |  vercel.app (prod)                          │
└───────────────────────────┬──────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼──────────────────────────────────────┐
│  APPLICATION LAYER                                               │
│  Next.js 14 App Router (SSR + API Routes)                        │
│  ├── /src/app/             → Page routes                         │
│  ├── /src/app/api/         → Backend API endpoints               │
│  ├── /src/components/      → Reusable React components           │
│  └── /src/middleware.js    → Auth guard (Supabase SSR)           │
└───────┬───────────────────────────────┬──────────────────────────┘
        │                               │
┌───────▼───────────┐       ┌───────────▼──────────────────────────┐
│  SUPABASE CLOUD   │       │  PYTHON MICROSERVICE                 │
│  ├── PostgreSQL   │       │  Flask + OpenCV + YOLO               │
│  ├── Auth (JWT)   │       │  Port: 5001                          │
│  ├── Storage      │       │  services/cctv_tracker/app.py        │
│  ├── Realtime     │       │  Proxied via next.config.js rewrites │
│  └── Edge Fns     │       └──────────────────────────────────────┘
└───────────────────┘
        │
┌───────▼───────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                                │
│  ├── Google OAuth2      → Gmail integration & account mgmt       │
│  ├── Google Calendar    → Appointment sync                       │
│  ├── Google Meet        → Video meetings                         │
│  ├── LibreTranslate     → Chat translation (self-hosted Docker)  │
│  ├── Resend API         → Transactional email delivery           │
│  └── OpenRouter / AI    → Multi-model AI integration             │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Full Technology Stack

### Frontend

| Technology        | Version   | Purpose                                              |
|-------------------|-----------|------------------------------------------------------|
| **Next.js**       | 14.2.29   | Full-stack React framework (App Router, SSR, API Routes) |
| **React**         | ^18       | UI component library                                 |
| **TypeScript**    | ^5.9.3    | Type safety (config exists; JS/JSX used in most files) |
| **Tailwind CSS**  | ^3.4.19   | Utility-first CSS framework                          |
| **PostCSS**       | ^8.5.12   | CSS transformation pipeline                          |
| **Lucide React**  | ^0.511.0  | Icon library                                         |
| **Recharts**      | ^2.15.3   | Data visualization & analytics charts                |
| **@dnd-kit**      | 6.x / 8.x | Drag-and-drop for Kanban pipeline board              |
| **TipTap**        | ^3.22.4   | Rich text editor (notes, email composer)             |
| **react-hot-toast** | ^2.6.0 | Toast notification system                            |
| **react-phone-number-input** | ^3.4.16 | International phone number input       |
| **react-easy-crop** | ^5.5.7  | Image cropping for avatars                           |

### Backend (Next.js API Routes)

| Technology        | Version   | Purpose                                              |
|-------------------|-----------|------------------------------------------------------|
| **Next.js API Routes** | 14.x | REST API endpoints under `/src/app/api/`           |
| **@supabase/ssr** | ^0.5.2    | Supabase server-side client for SSR/middleware       |
| **@supabase/supabase-js** | ^2.49.4 | Supabase browser client                      |
| **pg**            | ^8.20.0   | PostgreSQL direct connection (admin operations)      |
| **axios**         | ^1.16.1   | HTTP client for external API calls                   |
| **node.js**       | LTS       | Runtime environment                                  |

### Database & Storage

| Technology        | Purpose                                              |
|-------------------|------------------------------------------------------|
| **Supabase PostgreSQL** | Primary relational database                   |
| **Row Level Security (RLS)** | Data isolation by `office_id` and role  |
| **Supabase Storage** | File uploads (student documents, chat attachments, avatars) |
| **Supabase Auth** | JWT-based authentication & session management         |
| **Supabase Realtime** | WebSocket subscriptions for live chat & updates   |
| **Supabase Edge Functions** | Serverless functions for email triggers    |

### Export & Document Generation

| Technology   | Version   | Purpose                                              |
|--------------|-----------|------------------------------------------------------|
| **jsPDF**    | ^2.5.1    | PDF generation (reports, payment receipts)           |
| **jspdf-autotable** | ^3.5.28 | Table rendering in PDFs                        |
| **ExcelJS**  | ^4.4.0    | Excel file generation for data exports               |
| **XLSX**     | ^0.18.5   | Excel read/write support                             |
| **PapaParse** | ^5.4.1   | CSV parsing for bulk student import                  |
| **file-saver** | ^2.0.5  | Browser file download trigger                        |
| **JSZip**    | ^3.10.1   | ZIP archive creation                                 |
| **QRCode**   | ^1.5.4    | QR code generation                                   |

### Python Microservice (CCTV Tracker)

| Technology           | Version       | Purpose                                        |
|----------------------|---------------|------------------------------------------------|
| **Flask**            | 2.3.3         | Python web framework                           |
| **OpenCV**           | 4.8.1.78      | Computer vision (headless)                     |
| **NumPy**            | 1.24.3        | Numerical computation                          |
| **Pillow**           | 10.0.1        | Image processing                               |
| **Gunicorn**         | 21.2.0        | WSGI production server                         |
| **YOLO Model**       | Custom        | Employee detection AI model                    |
| **FFmpeg**           | Latest        | Video processing & streaming                   |

**Location**: `services/cctv_tracker/`
**Entry Point**: `services/cctv_tracker/app.py`
**Runs on**: Port `5001`
**Proxied by Next.js**: `/video_feed`, `/start_tracking`, `/stop_tracking`, `/status`, `/logs`, `/upload_video`

### Translation Service

| Technology        | Purpose                                              |
|-------------------|------------------------------------------------------|
| **LibreTranslate** | Self-hosted translation engine (Docker container)   |
| **Docker**        | LibreTranslate container runtime                     |
| **Supported Languages** | English, Korean (ko), Bengali (bn), Vietnamese (vi), Sinhala (si) |
| **Port**          | `5000`                                               |

### External Integrations

| Service              | Usage                                                |
|----------------------|------------------------------------------------------|
| **Google OAuth 2.0** | Gmail account linking for email management           |
| **Google Calendar API** | Appointment sync with Google Calendar            |
| **Google Meet API**  | Video meeting creation                               |
| **Resend API**       | Transactional email (assignments, reminders)         |
| **OpenRouter**       | Multi-model AI gateway (OpenAI, Claude, Gemini, DeepSeek, Llama) |
| **HLS.js**           | Live video streaming for CCTV feeds                  |

### DevOps & Deployment

| Technology     | Purpose                                              |
|----------------|------------------------------------------------------|
| **Vercel**     | Primary deployment platform                          |
| **Docker**     | LibreTranslate containerization                      |
| **Docker Compose** | Local development multi-service orchestration    |
| **Caddy**      | Reverse proxy (production, see `Caddyfile`)          |
| **GitHub**     | Source control                                       |
| **ESLint**     | Code linting (disabled in build for speed)           |

---

## 📁 Project File Structure

```
d:\GT CRM WEB PROJECT\gtgroupcrmproject\
│
├── package.json              ← npm scripts & all dependencies
├── next.config.js            ← Next.js config + CCTV proxy rewrites
├── tailwind.config.js        ← Brand design tokens
├── postcss.config.js         ← CSS pipeline
├── jsconfig.json             ← Path aliases
├── tsconfig.json             ← TypeScript configuration
├── .env.local                ← Environment variables (NOT committed)
├── .eslintrc.json            ← ESLint rules
├── vercel.json               ← Vercel deployment config
├── docker-compose.yml        ← LibreTranslate service
├── docker-compose.prod.yml   ← Production multi-service
├── Caddyfile                 ← Reverse proxy config
├── start-all.js              ← Unified dev startup (Next.js + Python)
│
├── src/
│   ├── middleware.js          ← Route protection (Supabase Auth)
│   │
│   ├── app/                  ← Next.js App Router pages & API
│   │   ├── layout.jsx        ← Root HTML layout
│   │   ├── page.jsx          ← Root redirect
│   │   ├── login/            ← 🔐 Authentication page
│   │   ├── dashboard/        ← 🏠 Main dashboard (KPIs, charts)
│   │   ├── students/         ← 👥 Student/Lead management
│   │   ├── contacts/         ← 📞 Contact management
│   │   ├── pipeline/         ← 📋 Kanban pipeline board
│   │   ├── appointments/     ← 📅 Appointments & calendar
│   │   ├── tasks/            ← ✅ Task management
│   │   ├── tasks-events/     ← 📆 Tasks + Events combined
│   │   ├── chat/             ← 💬 Real-time chat system
│   │   ├── cctv/             ← 📹 CCTV monitoring module
│   │   ├── hr/               ← 👤 HR & employee management
│   │   ├── expenses/         ← 💰 Expense tracking
│   │   ├── expenditure/      ← 📊 Expenditure reports
│   │   ├── reports/          ← 📈 Analytics & reports
│   │   ├── inventory/        ← 📦 Inventory management
│   │   ├── visitors/         ← 🚶 Visitor tracking
│   │   ├── social-media/     ← 📱 GT Social module
│   │   ├── settings/         ← ⚙️ System settings
│   │   ├── portal/           ← 🌐 University portal
│   │   ├── nexus/            ← 🔗 Nexus integration
│   │   ├── website/          ← 🌍 Website integration
│   │   ├── work_schedule/    ← 📅 Work schedule management
│   │   └── api/              ← 🔌 Backend API endpoints
│   │       ├── auth/         ← Auth callbacks (Google OAuth)
│   │       ├── chat/         ← Chat API (attachments, translate, notifications)
│   │       ├── students/     ← Student CRUD API
│   │       └── ...           ← All other module APIs
│   │
│   ├── components/           ← Reusable React components
│   │   ├── layout/           ← Sidebar, Header, Navigation
│   │   ├── dashboard/        ← KPICard, Charts, ActivityFeed
│   │   ├── students/         ← StudentTable, StudentForm, Tabs
│   │   ├── pipeline/         ← KanbanBoard, KanbanCard
│   │   ├── chat/             ← ChatShell, MessageBubble, Sidebar
│   │   ├── cctv/             ← Camera feed, monitoring UI
│   │   └── ui/               ← Shared UI: Modal, Button, Badge, Table
│   │
│   ├── lib/                  ← Utility modules & service clients
│   │   ├── supabase.js       ← Browser Supabase client
│   │   ├── supabase-server.js← Server-side Supabase client
│   │   ├── auth.js           ← Auth helpers & session
│   │   ├── permissions.js    ← RBAC permission checks
│   │   ├── emailRouter.js    ← Email routing logic
│   │   ├── emailSending.js   ← Email delivery via Resend
│   │   ├── emailAccountManager.js ← Gmail account management
│   │   ├── emailPolicies.js  ← Email access policies
│   │   ├── emailTemplates/   ← HTML email templates
│   │   ├── googleOAuth.js    ← Google OAuth flow
│   │   ├── googleCalendar.js ← Calendar integration
│   │   ├── googleMeet.js     ← Meet integration
│   │   ├── notifications.js  ← In-app notification helpers
│   │   ├── permissions.js    ← Role-based access control
│   │   ├── officeMetadata.js ← Office data helpers
│   │   ├── flagMapping.js    ← Country flag emoji mapping
│   │   ├── cropImage.js      ← Image crop utility
│   │   ├── chat-storage.js   ← Chat file storage helpers
│   │   ├── useAppSettings.js ← App settings hook
│   │   ├── cctv/             ← CCTV utility functions
│   │   ├── pdf/              ← PDF generation utilities
│   │   └── social-media/     ← Social media helpers
│   │
│   ├── context/              ← React Context providers
│   ├── hooks/                ← Custom React hooks
│   ├── services/             ← Frontend service layers
│   └── styles/               ← CSS Modules (per page/component)
│
├── supabase/
│   ├── migrations/           ← SQL migration files (numbered)
│   └── functions/            ← Supabase Edge Functions
│
├── services/
│   └── cctv_tracker/         ← Python Flask AI microservice
│       ├── app.py            ← Flask entry point
│       ├── employee_tracking_fixed.py ← YOLO tracking logic
│       ├── requirements.txt  ← Python dependencies
│       ├── yolo_model/       ← AI model files
│       └── Dockerfile        ← Container build
│
├── public/                   ← Static assets
│   ├── logo-gt-group.png
│   ├── country_flags/        ← Flag images
│   └── ...
│
└── scripts/                  ← Utility/migration scripts
```

---

## 🎨 Design System & Brand Tokens

The project uses a **dark premium theme** (dark navy + gold). All tokens are defined in `tailwind.config.js` and CSS custom properties.

### Color Palette

| Token            | Value       | Usage                             |
|------------------|-------------|-----------------------------------|
| `gold`           | `#EFB748`   | Primary accent, CTA buttons       |
| `gold-light`     | `#F1DA7C`   | Hover states, highlights          |
| `gold-dim`       | `#E6BC32`   | Subtle gold accents               |
| `gold-dark`      | `#C9930A`   | Pressed states, dark gold         |
| `navy`           | `#080B14`   | Base dark background              |
| `surface-1`      | `#161918`   | Primary surface                   |
| `surface-2`      | `#1E2220`   | Elevated surface                  |
| `surface-3`      | `#252928`   | Card backgrounds                  |
| `card`           | `#1A1E1C`   | Card component background         |
| `bg`             | `#0F1110`   | Root page background              |
| `text`           | `#F0EDE6`   | Primary text                      |
| `text-muted`     | `#9A9EA8`   | Secondary text, labels            |
| `text-dim`       | `#5A5E68`   | Placeholder, disabled text        |
| `success`        | `#10B981`   | Success states                    |
| `warning`        | `#F59E0B`   | Warning states                    |
| `danger`         | `#EF4444`   | Error/destructive actions         |
| `info`           | `#3B82F6`   | Info states                       |
| `purple`         | `#8B5CF6`   | Special accents                   |

### Typography

| Font             | Usage                              |
|------------------|------------------------------------|
| **Inter**        | Primary body & UI font (sans)      |
| **Outfit**       | Display headings (display)         |
| **JetBrains Mono** | Code blocks & monospace (mono)   |

### Glassmorphism Pattern

UI components use glassmorphism with `backdrop-blur`, subtle gradients, and gold box shadows.

```css
/* Standard glass card */
background: linear-gradient(135deg, rgba(239,183,72,0.06) 0%, rgba(255,255,255,0.03) 100%);
backdrop-filter: blur(16px);
border: 1px solid rgba(239,183,72,0.12);
box-shadow: 0 0 32px rgba(201,162,39,0.15);
```

---

## 🔐 Authentication & Authorization

### Authentication Flow

```
1. User visits any protected route
2. middleware.js intercepts request
3. Supabase session checked via createServerClient
4. If no session → redirect to /login
5. If session valid → request proceeds
6. Role loaded from users table → determines UI & data access
```

### Session Management

- **Provider**: Supabase Auth (JWT-based)
- **Persistence**: Cookie-based via `@supabase/ssr`
- **Middleware**: `src/middleware.js` guards all routes except `/login` and `/api`
- **Client**: `src/lib/supabase.js` (browser) + `src/lib/supabase-server.js` (server)

### RBAC Role Hierarchy

```
SUPER ADMIN (full system access — all offices, all data)
├── ceo
├── coo
└── it_manager

OFFICE STAFF (own office only — permissions configurable)
├── office_manager
├── senior_counselor
├── counselor
└── receptionist
```

### Permission System

**File**: `src/lib/permissions.js`

```js
// Usage in components:
import { can, isSuperAdmin } from '@/lib/permissions';

// Check permission:
can(user, 'students', 'delete')   // → true | false
can(user, 'payments', 'create')   // → true | false
isSuperAdmin(user.role)           // → true for CEO, COO, IT Manager
```

**Feature → Action Matrix** (configurable per role in Settings → Permissions):

| Feature      | Actions Available                    |
|--------------|--------------------------------------|
| `students`   | view, create, edit, delete           |
| `documents`  | view, create, edit, delete           |
| `payments`   | view, create, edit, delete           |
| `pipeline`   | view, create, edit, delete           |
| `appointments` | view, create, edit, delete         |
| `destinations` | view, create, edit, delete         |
| `universities` | view, create, edit, delete         |
| `reports`    | view, create, edit, delete           |
| `settings`   | view, create, edit, delete           |
| `users`      | view, create, edit, delete           |
| `offices`    | view, create, edit, delete           |

### Row Level Security (RLS)

All sensitive tables enforce office-level data isolation:

```sql
-- Staff see only their office's data
CREATE POLICY "staff_own_office" ON students
  FOR SELECT USING (
    office_id = (SELECT office_id FROM users WHERE id = auth.uid())
    OR
    (SELECT role FROM users WHERE id = auth.uid()) IN ('ceo','coo','it_manager')
  );
```

---

## 🗄️ Database Schema Summary

**Platform**: Supabase PostgreSQL  
**Project Ref**: `kjppkkumublhiwzwufhe`

### Core Tables

| Table              | Purpose                                              |
|--------------------|------------------------------------------------------|
| `offices`          | GT Group office locations (KR, BD, LK, VN)          |
| `users`            | Staff accounts linked to Supabase Auth               |
| `role_permissions` | Configurable RBAC matrix                             |
| `students`         | Student/lead CRM records                             |
| `pipeline_history` | Student pipeline stage change log                    |
| `appointments`     | Scheduled meetings & consultations                   |
| `payments`         | Student payment records                              |
| `documents`        | Uploaded document metadata (file in Supabase Storage)|
| `interactions`     | Activity log for all student actions                 |
| `destinations`     | Target study-abroad countries                        |
| `universities`     | University database                                  |
| `programs`         | Degree programs per university                       |

### Chat System Tables

| Table                    | Purpose                                        |
|--------------------------|------------------------------------------------|
| `chat_conversations`     | DM threads with participant tracking           |
| `chat_direct_messages`   | Message storage with type metadata             |
| `chat_message_reads`     | Read receipt tracking                          |
| `chat_attachments`       | File metadata with Storage references          |
| `chat_presence`          | Real-time user availability                    |
| `chat_message_translations` | Translation cache per user                  |
| `chat_user_preferences`  | Language & notification preferences            |
| `chat_notifications`     | Persistent notification queue                  |
| `chat_pinned_messages`   | Pinned messages for groups and DMs             |

### Storage Buckets

| Bucket              | Visibility    | Purpose                              |
|---------------------|---------------|--------------------------------------|
| `student-documents` | Private       | Student file uploads                 |
| `chat-attachments`  | Private       | Chat file sharing                    |
| `avatars`           | Public        | User profile pictures                |

---

## 🌐 API Route Structure

All backend logic is handled via Next.js API Routes under `/src/app/api/`.

| Route Pattern               | Purpose                                       |
|-----------------------------|-----------------------------------------------|
| `/api/auth/google-oauth-callback` | Google OAuth2 callback handler          |
| `/api/chat/attachments`     | Upload/download chat files                    |
| `/api/chat/translate`       | Message translation via LibreTranslate        |
| `/api/chat/translate/languages` | Available language list                   |
| `/api/chat/notifications`   | Push notification CRUD                        |
| `/api/students/[id]`        | Student CRUD operations                       |
| `/api/payments`             | Payment record management                     |
| `/api/reports`              | Report data aggregation                       |

**CCTV Proxy Routes** (forwarded to Python service on port 5001):

| Route              | Forwarded To                     |
|--------------------|----------------------------------|
| `/video_feed`      | `http://127.0.0.1:5001/video_feed` |
| `/start_tracking`  | `http://127.0.0.1:5001/start_tracking` |
| `/stop_tracking`   | `http://127.0.0.1:5001/stop_tracking` |
| `/status`          | `http://127.0.0.1:5001/status`   |
| `/logs`            | `http://127.0.0.1:5001/logs`     |
| `/upload_video`    | `http://127.0.0.1:5001/upload_video` |

---

## ⚙️ Environment Variables

All environment variables must be set in `.env.local` (local) or Vercel Dashboard (production).

| Variable                             | Required | Purpose                                  |
|--------------------------------------|----------|------------------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`           | ✅        | Supabase project URL                     |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | ✅        | Supabase anonymous key                   |
| `SUPABASE_SERVICE_ROLE_KEY`          | ✅        | Supabase admin key (server-side only)    |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | ✅ | Supabase publishable key           |
| `DATABASE_URL`                       | ✅        | Direct PostgreSQL connection string      |
| `RESEND_API_KEY`                     | ⚠️        | Email delivery (required for email features) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID`       | ⚠️        | Google OAuth app client ID               |
| `GOOGLE_CLIENT_SECRET`               | ⚠️        | Google OAuth app secret                  |
| `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`    | ⚠️        | Google OAuth redirect callback URL       |
| `NEXT_PUBLIC_APP_URL`                | ✅        | App base URL (e.g., `http://localhost:3005`) |
| `CCTV_ENCRYPTION_KEY`               | ⚠️        | CCTV data encryption key (32 chars)      |
| `FFMPEG_PATH`                        | ⚠️        | Path to FFmpeg binary                    |
| `NEXT_PUBLIC_LIBRETRANSLATE_URL`     | ⚠️        | LibreTranslate service URL               |
| `NEXT_PUBLIC_DEFAULT_TRANSLATION_ENGINE` | ⚠️   | Translation engine (`libretranslate`)    |
| `NEXT_PUBLIC_ENABLE_CHAT_TRANSLATION` | ⚠️      | Toggle chat translation (`true`/`false`) |
| `GOOGLE_TRANSLATE_API_KEY`           | 🔜        | Google Translate API (future phase)      |

> ⚠️ = Required for full functionality. 🔜 = Planned for future phase.

---

## 🚀 Development Setup

### Prerequisites

- Node.js LTS (18+)
- Python 3.8+ (for CCTV tracker)
- Docker Desktop (for LibreTranslate)
- FFmpeg (for video processing)

### Start Development Server

```bash
# Install dependencies
npm install

# Start both Next.js (port 3005) + Python CCTV tracker (port 5001)
npm run dev
# Internally runs: node start-all.js

# Start LibreTranslate translation service (Docker)
docker-compose up -d

# Start Python CCTV tracker manually (optional, if needed separately)
cd services/cctv_tracker
pip install -r requirements.txt
python app.py
```

### Build for Production

```bash
npm run build
npm start
# Or: node start-all.js --prod
```

### Supabase Database Management

```bash
# Push migrations
supabase db push

# Or apply manually in Supabase SQL Editor
# Migration files: supabase/migrations/
```

---

## 📦 Application Modules Reference

| Module               | Route              | Status | Description                                    |
|----------------------|--------------------|--------|------------------------------------------------|
| Authentication       | `/login`           | ✅ Live | Supabase Auth, JWT session management           |
| Dashboard            | `/dashboard`       | ✅ Live | KPIs, charts, activity feed, office comparison  |
| Students / Leads     | `/students`        | ✅ Live | Full CRUD, Kanban pipeline, profile tabs         |
| Contacts             | `/contacts`        | ✅ Live | Contact management                              |
| Pipeline             | `/pipeline`        | ✅ Live | Kanban drag-and-drop board                      |
| Appointments         | `/appointments`    | ✅ Live | Calendar, scheduling, reminders                 |
| Tasks & Events       | `/tasks-events`    | ✅ Live | Task management with event integration          |
| Chat System          | `/chat`            | ✅ Live | Real-time messaging, groups, DMs, file sharing  |
| CCTV Monitoring      | `/cctv`            | ✅ Live | Live camera feeds, employee AI tracking         |
| HR Management        | `/hr`              | ✅ Live | Attendance, leave, employee management          |
| Expenses             | `/expenses`        | ✅ Live | Expense tracking                                |
| Expenditure          | `/expenditure`     | ✅ Live | Expenditure reports                             |
| Reports & Analytics  | `/reports`         | ✅ Live | PDF/Excel exports, revenue dashboards           |
| Inventory            | `/inventory`       | ✅ Live | Inventory management                            |
| Visitors             | `/visitors`        | ✅ Live | Visitor check-in/out system                     |
| Social Media         | `/social-media`    | ✅ Live | GT Social marketing assets                      |
| Settings             | `/settings`        | ✅ Live | Users, offices, permissions, general settings   |
| University Portal    | `/portal`          | ✅ Live | University-facing application review            |
| Nexus                | `/nexus`           | 🔜     | Advanced integration module                     |
| Website Integration  | `/website`         | 🔜     | Corporate website management                    |
| Work Schedule        | `/work_schedule`   | ✅ Live | Staff scheduling system                         |

---

## 💬 Chat System Architecture

The chat system is production-grade with modular components:

```
ChatShell.jsx (State Management & Realtime)
├── ChatSidebar.jsx (Navigation)
│   ├── GroupItem.jsx (Group List Item)
│   └── DMItem.jsx (DM List Item)
├── ChatHeader.jsx (Context Info)
├── MessageList.jsx (Message Container)
│   └── MessageBubble.jsx (Message Display + Actions)
└── MessageInput.jsx (Compose + File Attach)

Supporting:
├── Supabase Realtime (WebSocket subscriptions)
├── /api/chat/attachments (File upload/download)
├── /api/chat/translate (LibreTranslate integration)
└── /api/chat/notifications (Push notification queue)
```

**Key Features**: End-to-end encryption ready, read receipts, message reactions, translation, file sharing, browser notifications, offline mode.

---

## 📹 CCTV & Employee Tracking

**Service**: Python Flask microservice at `services/cctv_tracker/`

**Technology Stack**:
- YOLO (You Only Look Once) for employee detection
- OpenCV for video frame processing
- Flask for REST API + video streaming endpoints
- FFmpeg for video format handling
- HLS.js (frontend) for live stream playback

**Integration**: Next.js proxies CCTV routes to the Python service via `next.config.js` rewrites, allowing seamless browser access without CORS issues.

---

## 📊 Current Phase Status

| Phase   | Description                         | Status       | Completion |
|---------|-------------------------------------|--------------|------------|
| Phase 1 | Foundation (CRM, SFMS, Auth, DB)   | ✅ Complete   | Done       |
| Phase 2 | Finance, HR, CCTV, Chat             | ✅ Complete   | Done       |
| Phase 3 | Modular Architecture, DB Hardening  | ✅ Complete   | May 2026   |
| Phase 4 | 28 test suite, verification         | ✅ Complete   | Done       |
| Phase 5 | GT AI Platform                      | 🔜 Planned   | Next       |
| Phase 6 | Mobile Apps (React Native/Expo)     | 🔜 Planned   | Future     |
| Phase 7 | Advanced Automation & BI Analytics  | 🔜 Planned   | Future     |

---

## 🔒 Security Practices

| Area                | Implementation                                      |
|---------------------|-----------------------------------------------------|
| Authentication      | Supabase Auth JWT (cookie-based via `@supabase/ssr`) |
| Authorization       | RBAC with `can()` helper + RLS on all DB tables     |
| Data Isolation      | `office_id` tenant isolation enforced at DB level    |
| File Access         | Private Supabase Storage buckets, RLS-restricted    |
| API Protection      | Server-side session validation on all API routes    |
| CCTV Encryption     | AES encryption key via `CCTV_ENCRYPTION_KEY` env   |
| Chat Security       | RLS policies restrict message visibility to participants |
| Middleware          | All routes protected, only `/login` and `/_next` skipped |

---

## 🎯 Coding Conventions

### File Naming
- Pages: `page.jsx` (Next.js App Router convention)
- Components: `PascalCase.jsx` (e.g., `StudentTable.jsx`)
- Utilities/Libs: `camelCase.js` (e.g., `permissions.js`)
- CSS Modules: `kebab-case.module.css` (e.g., `chat.module.css`)

### Import Patterns
```js
// Supabase browser client
import { createClientComponentClient } from '@supabase/ssr';
// or from lib:
import { supabase } from '@/lib/supabase';

// Supabase server client (in API routes / server components)
import { createServerSupabase } from '@/lib/supabase-server';

// Permission checks
import { can, isSuperAdmin } from '@/lib/permissions';

// Icons
import { UserIcon, BuildingIcon } from 'lucide-react';
```

### State Management
- **Local state**: `useState` / `useReducer`
- **Server state**: Direct Supabase queries via hooks
- **Real-time**: Supabase Realtime subscriptions in `useEffect`
- **No global state library** (no Redux/Zustand) — Supabase handles persistence

### Styling Approach
- **Primary**: Tailwind CSS utility classes with custom brand tokens
- **Module CSS**: Used for complex animations and page-specific styles
- **Glassmorphism**: Standard pattern for cards, panels, modals
- **No Shadcn UI** in current implementation (Tailwind only)

---

## 📝 Key Decisions Log

| Decision                     | Choice Made                          | Reason                                      |
|------------------------------|--------------------------------------|---------------------------------------------|
| Authentication               | Supabase Auth (email + password)     | Integrated with DB, easy session management |
| Database                     | Supabase PostgreSQL                  | Project pre-configured, RLS support         |
| Deployment                   | Vercel                               | Next.js native, easy env management         |
| Multi-office isolation       | `office_id` on every record + RLS   | Ensures data privacy between offices        |
| File storage                 | Supabase Storage                     | Integrated auth, presigned URLs             |
| Real-time                    | Supabase Realtime (WebSocket)        | Built-in, no separate infrastructure        |
| CCTV backend                 | Python Flask + YOLO                  | Best ecosystem for CV/AI workloads          |
| Translation                  | LibreTranslate (self-hosted Docker)  | Privacy, no per-request cost               |
| Email delivery               | Resend API                           | Modern API, high deliverability             |
| Chart library                | Recharts                             | React-native, good TypeScript support       |
| Drag-and-drop                | @dnd-kit                             | Accessibility-first, flexible               |
| Rich text                    | TipTap                               | Headless, extensible                        |

---

## 📞 Quick Reference: Where Things Are

| Task                              | File / Location                              |
|-----------------------------------|----------------------------------------------|
| Add a new page/route              | `src/app/<route>/page.jsx`                   |
| Add a new API endpoint            | `src/app/api/<route>/route.js`               |
| Modify RBAC permissions           | `src/lib/permissions.js`                     |
| Add new Tailwind color            | `tailwind.config.js` → `theme.extend.colors` |
| Modify auth middleware            | `src/middleware.js`                          |
| Add database migration            | `supabase/migrations/<num>_name.sql`         |
| Modify CCTV tracker               | `services/cctv_tracker/app.py`               |
| Add email template                | `src/lib/emailTemplates/`                    |
| Add environment variable          | `.env.local` + Vercel dashboard              |
| Modify Docker services            | `docker-compose.yml`                         |
| Add CCTV proxy route              | `next.config.js` → `rewrites()`             |

---

*Last Updated: June 2026 | Generated by Antigravity AI Agent*
*For questions about this project, refer to `newupdate-crmproject.md` (product spec) and `implementation_plan.md` (technical plan).*
