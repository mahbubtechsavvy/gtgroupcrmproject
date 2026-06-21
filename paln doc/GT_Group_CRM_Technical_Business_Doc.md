# GT Group CRM Project

## Complete Technical & Business Documentation

---

# EXECUTIVE SUMMARY

**Project Name:** GT Group Study Abroad CRM
**Project Type:** Enterprise Web Application (SaaS)
**Deployment URL:** [gtgroupcrmproject.vercel.app](https://gtgroupcrmproject.vercel.app)
**Development Period:** 2023 - 2026
**Current Status:** Production Ready

## Overview

GT Group CRM is a comprehensive, production-grade student consultancy management platform designed for international education consultancy operations. The system serves four global offices with a centralized, secure platform enabling complete student lifecycle management from lead generation to enrollment and beyond.

---

# TABLE OF CONTENTS

1. [Business Overview](#1-business-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Core Features](#3-core-features)
4. [Extended Modules](#4-extended-modules)
5. [Security & Permissions](#5-security--permissions)
6. [Integrations](#6-integrations)
7. [Database Schema](#7-database-schema)
8. [Business Intelligence](#8-business-intelligence)
9. [Revenue Model](#9-revenue-model)
10. [Development Roadmap](#10-development-roadmap)

---

# 1. BUSINESS OVERVIEW

## 1.1 Company Background

| Attribute        | Details                                                            |
| ---------------- | ------------------------------------------------------------------ |
| **Company Name** | GT Group                                                           |
| **Industry**     | Global Education Consultancy                                       |
| **Founded**      | 2019                                                               |
| **Headquarters** | South Korea                                                        |
| **Offices**      | 4 (South Korea, Bangladesh, Sri Lanka, Vietnam)                    |
| **Mission**      | Bridge the gap between aspiring students and world-class education |

## 1.2 Business Statistics

| Metric                | Value  |
| --------------------- | ------ |
| Total Offices         | 4      |
| Total Students Placed | 5,000+ |
| Partner Universities  | 200+   |
| Visa Success Rate     | 98%    |
| Countries Served      | 4+     |
| Staff Members         | 25+    |

## 1.3 Office Locations

| Office      | Country     | Flag | Primary Services                       |
| ----------- | ----------- | ---- | -------------------------------------- |
| Seoul       | South Korea | 🇰🇷   | Head Office, University Partnerships   |
| Dhaka       | Bangladesh  | 🇧🇩   | Student Recruitment, Visa Processing   |
| Colombo     | Sri Lanka   | 🇱🇰   | Student Recruitment, Document Services |
| Ho Chi Minh | Vietnam     | 🇻🇳   | Student Recruitment, Language Courses  |

## 1.4 Target Markets

- **Primary:** South Korea, Bangladesh, Sri Lanka, Vietnam
- **Secondary:** Japan, China, Nepal, Myanmar, Malaysia
- **Destination Countries:** UK, USA, Canada, Australia, Germany, Japan, South Korea, Singapore

---

# 2. TECHNICAL ARCHITECTURE

## 2.1 Technology Stack

### Frontend

| Technology    | Version | Purpose                         |
| ------------- | ------- | ------------------------------- |
| Next.js       | 14      | Framework (App Router, SSR/SSG) |
| React         | 18      | UI Library                      |
| TypeScript    | -       | Type Safety                     |
| Tailwind CSS  | -       | Styling Framework               |
| Lucide React  | -       | Icons                           |
| Recharts      | -       | Data Visualization              |
| Tiptap        | -       | Rich Text Editor                |
| Framer Motion | -       | Animations                      |

### Backend & Database

| Technology               | Purpose                            |
| ------------------------ | ---------------------------------- |
| Supabase                 | PostgreSQL Database, Auth, Storage |
| Supabase Edge Functions  | Serverless Functions               |
| Row Level Security (RLS) | Data Access Control                |
| JWT                      | Authentication Tokens              |

### Third-Party Services

| Service          | Purpose                      |
| ---------------- | ---------------------------- |
| Resend API       | Email Delivery               |
| Google OAuth 2.0 | Email Account Authentication |
| Google Meet      | Video Conferencing           |
| Google Calendar  | Event Scheduling             |
| Vercel           | Deployment Platform          |

## 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 14)                    │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Login  │ │Dashboard│ │Students │ │ Pipeline│           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       └──────────┴──────────┴──────────┴────────────────┘  │
└────────────────────────────┬────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   Middleware    │
                    │ (Auth & Roles)  │
                    └────────┬────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    BACKEND API (20+ Routes)                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  /auth   │ │  /email  │ │ /students│ │ /reports │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Tables (40+) │ Storage │ Auth │ Realtime │ Edge Fn  │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    EXTERNAL SERVICES                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Resend  │ │ Google  │ │ Google  │ │  Vercel │           │
│  │   API   │ │  OAuth  │ │  Meet   │ │   CDN   │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 2.3 Project Structure

```
gtgroupcrmproject/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── login/              # Authentication
│   │   ├── dashboard/         # Main dashboard
│   │   ├── students/          # Student management
│   │   ├── pipeline/          # Kanban pipeline
│   │   ├── appointments/     # Calendar & scheduling
│   │   ├── contacts/         # Contact management
│   │   ├── tasks/            # Task tracking
│   │   ├── reports/          # Analytics & reports
│   │   ├── website/          # Website CMS
│   │   ├── nexus/            # Project management
│   │   ├── social-media/     # Social media hub
│   │   ├── cctv/             # CCTV monitoring
│   │   ├── hr/               # HR management
│   │   ├── work_schedule/    # Staff scheduling
│   │   ├── expenses/         # Expense tracking
│   │   ├── inventory/       # Inventory management
│   │   ├── chat/             # Internal messaging
│   │   ├── visitors/         # Visitor management
│   │   ├── settings/         # System settings
│   │   └── api/              # API routes
│   ├── components/           # Reusable UI components
│   ├── lib/                  # Utility functions
│   ├── styles/               # CSS files
│   └── middleware.js         # Auth middleware
├── public/                   # Static assets
├── supabase/                 # Database migrations
└── package.json              # Dependencies
```

## 2.4 Build & Deployment

| Attribute                  | Value         |
| -------------------------- | ------------- |
| **Build Status**           | ✅ Successful |
| **Errors**                 | 0             |
| **Lines of Code**          | 5,400+        |
| **Deployment Platform**    | Vercel        |
| **Local Development Port** | 3005          |
| **Package Manager**        | npm           |

---

# 3. CORE FEATURES

## 3.1 Authentication & Authorization

### Login System

- **Method:** Email/Password via Supabase Auth
- **Session:** JWT tokens with expiration
- **Features:**
  - Branded login page with GT Group styling
  - Password reset functionality
  - Session persistence
  - Multi-device support

### Role-Based Access Control (RBAC)

| Role                 | Description          | Access Level                                  |
| -------------------- | -------------------- | --------------------------------------------- |
| **Super Admin**      | CEO, COO, IT Manager | Full system access, all offices, all settings |
| **Office Manager**   | Regional managers    | Own office data, staff management             |
| **Senior Counselor** | Lead counselors      | Own office students, pipeline management      |
| **Counselor**        | Regular staff        | Own office students, limited editing          |
| **Receptionist**     | Front desk           | View-only, visitor logging                    |

## 3.2 Student Management

### Student Profile Fields

- **Personal Information:** Name, photo, gender, date of birth, nationality
- **Contact Details:** Phone, email, address, emergency contact
- **Academic History:** Previous education, grades, certificates
- **Study Preferences:** Destination country, intended major, budget
- **Office Assignment:** Assigned office, assigned counselor
- **Lead Source:** How the student found GT Group

### Student Features

- ✅ Multi-field search & advanced filtering
- ✅ Office, status, counselor, destination filtering
- ✅ Bulk import/export (CSV, PDF)
- ✅ Interaction timeline & history
- ✅ Profile tabs: Overview | Documents | Payments | Notes | History

## 3.3 Pipeline Management

### 9-Stage Kanban Pipeline

| Stage | Description            | Color         |
| ----- | ---------------------- | ------------- |
| 1     | New Lead               | 🔵 Blue       |
| 2     | Initial Consultation   | 🟢 Green      |
| 3     | Document Collection    | 🟡 Yellow     |
| 4     | University Application | 🟠 Orange     |
| 5     | Offer Received         | 🟣 Purple     |
| 6     | Visa Application       | 🔴 Red        |
| 7     | Visa Approved          | ✅ Teal       |
| 8     | Enrolled               | 💚 Dark Green |
| 9     | Completed/Dropped      | ⚪ Gray       |

### Pipeline Features

- Drag-and-drop card movement
- Country flags on student cards
- University & counselor information
- Stage duration tracking
- Status change audit logs with reasons & timestamps
- Rejection & deferral options

## 3.4 Appointment System

### Appointment Types

1. **Initial Consultation** - First meeting with prospective student
2. **Document Review** - Checking student documents
3. **Application Review** - University application review
4. **Mock Interview** - Interview preparation
5. **Follow-up** - Regular check-in
6. **Walk-in** - Unscheduled visits

### Features

- Monthly/Weekly/Daily calendar views
- Email reminders (24 hours before)
- Status tracking: Scheduled | Completed | Cancelled | No-show
- Overdue appointment alerts
- Google Meet integration for online meetings
- 42-character unique Meet ID generation

## 3.5 Document Management

### Document Types (12+)

| Type                  | Description            |
| --------------------- | ---------------------- |
| Passport              | Valid passport copy    |
| Transcripts           | Academic transcripts   |
| Certificates          | Education certificates |
| IELTS/TOEFL           | Language test scores   |
| Birth Certificate     | Proof of age           |
| Bank Statement        | Financial documents    |
| Recommendation Letter | Teacher references     |
| Offer Letter          | University offer       |
| Visa Letters          | Visa-related documents |
| Photo                 | Passport photos        |
| Medical Certificate   | Health documents       |
| Others                | Custom document types  |

### Features

- Supabase Storage with organized folders
- Folder structure: `/students/{studentId}/{documentType}`
- Document status: Pending | Verified | Rejected
- Notes & audit trail
- Bulk upload capability

## 3.6 Payment & Revenue Tracking

### Payment Categories

| Category               | Description                 |
| ---------------------- | --------------------------- |
| Consultation           | Initial consultation fees   |
| Application            | University application fees |
| Visa                   | Visa processing fees        |
| Courier/Docs           | Document shipping fees      |
| University Application | Direct to universities      |
| Other                  | Miscellaneous fees          |

### Payment Methods

- **Cash** - In-person payments
- **Bank Transfer** - Wire transfers
- **Mobile Banking** - bKash, Nagad, etc.

### Currencies Supported

- **BDT** - Bangladeshi Taka
- **LKR** - Sri Lankan Rupee
- **KRW** - South Korean Won
- **VND** - Vietnamese Dong
- **USD** - US Dollar

### Payment Status

- ✅ **Paid** - Completed payment
- ⏳ **Pending** - Awaiting payment
- 📝 **Partial** - Partially paid
- ↩️ **Refunded** - Payment returned

### Features

- Receipt generation
- Payment reports by office
- Revenue analytics by destination
- Counselor performance tracking
- Outstanding payment alerts

## 3.7 Analytics Dashboard

### Super Admin View (CEO/COO)

- **Global KPIs:**
  - Total Students
  - Active Leads
  - Visa Approvals (Monthly/Yearly)
  - Total Enrolled
  - Total Revenue
- **Office Comparisons:** Side-by-side performance
- **Monthly Trends:** Growth visualization
- **Office Cards:** By country with flags

### Staff View (Counselors)

- **Personal KPIs:**
  - My Students
  - Active Leads
  - Monthly Enrollments
  - My Revenue
- **Lead Source Breakdown:** Where leads come from
- **Destination Popularity:** Where students want to go
- **Recent Activity Feed**
- **Today's Appointments**
- **Overdue Follow-ups Widget**
- **Quick Actions:** Add Student, Schedule Appointment

---

# 4. EXTENDED MODULES

## 4.1 Website CMS

### Purpose

Manage public-facing website content directly from CRM

### Managed Sections

| Section            | Description                |
| ------------------ | -------------------------- |
| Destinations       | Study abroad countries     |
| Universities       | Partner institutions       |
| Programs           | Available courses          |
| Scholarships       | Funding options            |
| News               | Blog posts & updates       |
| Events             | Webinars & consultations   |
| FAQs               | Frequently asked questions |
| Legal Pages        | Terms, privacy policy      |
| Success Stories    | Student testimonials       |
| Team               | Staff profiles             |
| Testimonials       | Client reviews             |
| Partners           | Business partners          |
| Newsletter         | Email subscribers          |
| Application Portal | Online applications        |

### Features

- Publish/Unpublish controls
- Content synchronization with public websites
- Multi-language support
- Media management

## 4.2 Email Management System

### Dual Email System

| Account Type       | Purpose                     | Email Client    |
| ------------------ | --------------------------- | --------------- |
| **Personal Gmail** | Direct client communication | Gmail interface |
| **System Email**   | Automated notifications     | CRM interface   |

### Features

- **Google OAuth 2.0** - Secure authentication
- **Policy-based Routing** - Admin-configurable rules
  - Meetings → Personal Gmail
  - Notifications → System Email
- **Email Logging** - 24 tracked fields per email
- **Automatic Triggers** - Event-based sending
- **Retry Mechanism** - Up to 3 attempts on failure
- **Email History Dashboard** - Search & filter
- **Audit Trail** - Compliance tracking

### Tracked Email Fields

1. Sender
2. Recipient
3. CC/BCC
4. Subject
5. Body
6. Timestamp
7. Status
8. Policy applied
9. Retry count
10. Error messages
    ... and 14 more

## 4.3 Social Media Hub

### Supported Platforms

- **WhatsApp Business** - Direct messaging
- **Facebook** - Page management
- **Instagram** - Visual content

### Features

- Centralized account management
- Content logging & engagement tracking
- Per-office social media strategies
- Post scheduling
- Analytics & reporting

## 4.4 CCTV Monitoring System

### Purpose

Multi-office camera surveillance

### Features

- Real-time streaming (HLS support via hls.js)
- Device management (add/edit/delete cameras)
- Camera filtering by office
- Staggered stream loading
- Multi-office view

## 4.5 HR Management

### Features

- Staff profiles
- Role management
- Attendance tracking
- Performance reviews
- Leave management

## 4.6 Work Scheduling

### Features

- Staff shift management
- Schedule visualization
- Conflict detection
- Notification system

## 4.7 Expense Tracking

### Features

- Expenditure logging
- Category-based tracking
- Approval workflows
- Budget monitoring

## 4.8 Inventory Management

### Features

- Asset tracking
- Stock management
- Reorder alerts
- Depreciation tracking

## 4.9 Internal Chat

### Features

- Team messaging
- Direct messages
- Group chats
- File sharing
- Read receipts

## 4.10 Visitor Management

### Features

- Visitor check-in/check-out
- Purpose of visit
- Host notification
- Visit history
- Badge printing

---

# 5. SECURITY & PERMISSIONS

## 5.1 Authentication Security

| Feature                | Implementation           |
| ---------------------- | ------------------------ |
| **Password Storage**   | Supabase Auth (bcrypt)   |
| **Session Management** | JWT with expiration      |
| **Token Refresh**      | Automatic refresh        |
| **Multi-factor**       | Ready for implementation |

## 5.2 Data Security

### Row Level Security (RLS)

- ✅ Enabled on ALL tables
- ✅ Policies per role
- ✅ Office-based isolation
- ✅ User-based filtering

### RLS Policy Types

1. **Read Access** - View own office data
2. **Write Access** - Edit own records
3. **Admin Access** - Full access
4. **Public Access** - Website content only

## 5.3 API Security

| Protection           | Implementation                   |
| -------------------- | -------------------------------- |
| **Authentication**   | JWT token validation             |
| **Authorization**    | Role-based route protection      |
| **Rate Limiting**    | Configured at Vercel level       |
| **Input Validation** | Zod schema validation            |
| **SQL Injection**    | Parameterized queries (Supabase) |

## 5.4 Audit Logging

### Tracked Activities

- User login/logout
- Record creation/modification/deletion
- Pipeline stage changes
- Payment updates
- Document uploads
- Settings changes

---

# 6. INTEGRATIONS

## 6.1 Google Ecosystem

### Google OAuth 2.0

- **Purpose:** Secure email account authentication
- **Flow:** User authorizes → Token received → API calls made
- **Token Management:** Secure storage, automatic refresh

### Google Meet

- **Generation:** 42-character unique IDs
- **Integration:** Toggle in appointment form
- **Notifications:** Links included in emails

### Google Calendar

- **Status:** API ready
- **Features:** Event synchronization, reminders

## 6.2 Email Integration

### Resend API

- **Purpose:** Email delivery service
- **Implementation:** Supabase Edge Functions
- **Features:** Templates, tracking, analytics

### Email Templates

- Appointment reminders
- Pipeline stage notifications
- Payment confirmations
- Newsletter broadcasts

## 6.3 Payment Integration

### Stripe (Demo Ready)

- **Status:** Integration code in place
- **Features:** Card payments, subscriptions
- **Next Step:** Production API keys

## 6.4 Website Integration

### API Gateway

- **Purpose:** Bridge websites to CRM
- **Endpoints:**
  - `/api/leads` - Form submissions
  - `/api/appointments` - Booking system
  - `/api/stats` - Placement data
  - `/api/newsletter` - Subscriptions
  - `/api/payments` - Demo payments
  - `/api/website` - Content sync

---

# 7. DATABASE SCHEMA

## 7.1 Core Tables

| Table             | Description      | Key Fields                                  |
| ----------------- | ---------------- | ------------------------------------------- |
| `offices`         | Office locations | name, country, flag, phone, email           |
| `users`           | Staff accounts   | name, email, role, office_id                |
| `roles`           | User roles       | name, permissions                           |
| `students`        | Student records  | name, email, phone, office_id, counselor_id |
| `pipeline_stages` | Pipeline stages  | name, order, color                          |
| `pipeline_moves`  | Stage history    | student_id, from_stage, to_stage, reason    |

## 7.2 Transaction Tables

| Table          | Description        |
| -------------- | ------------------ |
| `appointments` | Scheduled meetings |
| `tasks`        | To-do items        |
| `payments`     | Payment records    |
| `documents`    | Uploaded files     |
| `email_logs`   | Email history      |

## 7.3 Content Tables

| Table          | Description            |
| -------------- | ---------------------- |
| `destinations` | Study abroad countries |
| `universities` | Partner institutions   |
| `programs`     | Available courses      |
| `news_posts`   | Blog articles          |
| `events`       | Webinars & events      |
| `testimonials` | Success stories        |

## 7.4 Extended Tables

| Table                   | Description          |
| ----------------------- | -------------------- |
| `user_email_accounts`   | Email configurations |
| `email_policies`        | Routing rules        |
| `social_media_accounts` | Social accounts      |
| `cctv_devices`          | Camera devices       |
| `hr_records`            | Staff records        |
| `expense_records`       | Expenses             |
| `inventory_items`       | Stock items          |
| `chat_messages`         | Internal messages    |
| `visitor_logs`          | Visitor records      |

---

# 8. BUSINESS INTELLIGENCE

## 8.1 Reports Available

### Conversion Reports

- Leads → Enrolled funnel
- Stage-by-stage conversion rates
- Drop-off analysis

### Revenue Reports

- Monthly/Quarterly/Yearly
- By office
- By counselor
- By destination country

### Performance Reports

- Counselor rankings
- Office comparisons
- Lead source effectiveness
- Destination popularity trends

### Document Reports

- Completion rates
- Verification status
- Pending items

## 8.2 Export Capabilities

| Format    | Use Case                 |
| --------- | ------------------------ |
| **PDF**   | Formal reports, receipts |
| **Excel** | Data analysis            |
| **CSV**   | Bulk operations          |
| **Print** | Physical documents       |

---

# 9. REVENUE MODEL

## 9.1 Income Streams

| Stream            | Description                | Average Value |
| ----------------- | -------------------------- | ------------- |
| Consultation Fees | Initial counseling         | $100-200      |
| Application Fees  | University applications    | $200-500      |
| Visa Services     | Visa processing            | $300-800      |
| Document Services | Courier, verification      | $50-150       |
| University Fees   | Direct university payments | $500-2000     |
| Course Sales      | IELTS, TOPIK classes       | $200-500      |

## 9.2 Revenue by Office

| Office      | Students  | Avg Revenue | Total          |
| ----------- | --------- | ----------- | -------------- |
| South Korea | 1,500     | $800        | $1,200,000     |
| Bangladesh  | 2,000     | $600        | $1,200,000     |
| Sri Lanka   | 1,000     | $550        | $550,000       |
| Vietnam     | 500       | $500        | $250,000       |
| **Total**   | **5,000** | **$640**    | **$3,200,000** |

## 9.3 Financial Metrics

| Metric                        | Value  |
| ----------------------------- | ------ |
| **Gross Margin**              | 45%    |
| **Net Margin**                | 18%    |
| **Customer Acquisition Cost** | $150   |
| **Customer Lifetime Value**   | $2,400 |
| **LTV:CAC Ratio**             | 16:1   |

---

# 10. DEVELOPMENT ROADMAP

## 10.1 Completed Phases

| Phase                      | Timeline | Status      |
| -------------------------- | -------- | ----------- |
| Phase 1: Core CRM          | 2023     | ✅ Complete |
| Phase 2: Google Meet       | 2024     | ✅ Complete |
| Phase 3: Email Accounts    | 2024     | ✅ Complete |
| Phase 4: Email Routing     | 2024     | ✅ Complete |
| Phase 5: Policy Management | 2024     | ✅ Complete |
| Phase 6: Testing           | 2025     | ✅ Complete |

## 10.2 Future Roadmap

### 2026 Q2-Q3

- [ ] Mobile App (Student portal)
- [ ] AI Chatbot integration
- [ ] Advanced analytics
- [ ] Payment gateway expansion (Stripe production)

### 2026 Q4

- [ ] API for partners
- [ ] White-label options
- [ ] Additional integrations

### 2027

- [ ] Mobile CRM app
- [ ] AI-powered recommendations
- [ ] International expansion
- [ ] Advanced automation

## 10.3 Resource Requirements

| Resource   | Current | Needed |
| ---------- | ------- | ------ |
| Developers | 1       | +2     |
| Designers  | 0       | +1     |
| Marketers  | 0       | +1     |
| Sales      | 0       | +1     |
| **Total**  | **1**   | **+5** |

---

# APPENDICES

## Appendix A: API Routes

```
/api/auth/*
/api/email-account/*
/api/send-event-emails
/api/email-retry
/api/google-oauth-*
/api/google-calendar-*
/api/social-media/*
/api/cctv/*
/api/contacts/*
/api/tasks/*
/api/admin/*
/api/policies/*
/api/students/*
/api/pipeline/*
/api/appointments/*
/api/payments/*
/api/documents/*
/api/reports/*
/api/destinations/*
/api/universities/*
/api/website/*
```

## Appendix B: Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

## Appendix C: Key Files

| File                   | Purpose                  |
| ---------------------- | ------------------------ |
| `src/middleware.js`    | Auth & role verification |
| `src/app/api/`         | All API routes           |
| `supabase/migrations/` | Database migrations      |
| `next.config.js`       | Next.js configuration    |

---

_Document Version: 1.0_
_Last Updated: April 2026_
_Prepared by: GT Group IT Department_
