# GT Group Web Projects

## Complete Technical & Business Documentation

---

# EXECUTIVE SUMMARY

**Project Name:** GT Group Web Ecosystem
**Project Type:** Digital Platform Monorepo
**Development Period:** 2024 - 2026
**Current Status:** Production Ready

## Overview

GT Group Web Ecosystem is a unified digital platform comprising three interconnected Next.js applications sharing a single Supabase database backend. This monorepo structure creates a cohesive digital presence for GT Group across multiple business lines while maintaining operational efficiency and data consistency.

---

# TABLE OF CONTENTS

1. [Business Overview](#1-business-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Application Details](#3-application-details)
4. [Shared Infrastructure](#4-shared-infrastructure)
5. [Lead Generation System](#5-lead-generation-system)
6. [Integration Points](#6-integration-points)
7. [Business Model](#7-business-model)
8. [Revenue Streams](#8-revenue-streams)
9. [Nexus Digital Agency](#9-nexus-digital-agency)
10. [Future Roadmap](#10-future-roadmap)

---

# 1. BUSINESS OVERVIEW

## 1.1 Platform Purpose

| Purpose                  | Description                               |
| ------------------------ | ----------------------------------------- |
| **Corporate Presence**   | Master Portal for brand building          |
| **Lead Generation**      | Study Consultancy for student recruitment |
| **Service Monetization** | Nexus Digital for external clients        |

## 1.2 Target Audiences

| Application       | Primary Audience         | Secondary Audience    |
| ----------------- | ------------------------ | --------------------- |
| Master Portal     | Internal teams, partners | Public visitors       |
| Study Consultancy | Prospective students     | Parents, educators    |
| Nexus Digital     | SMBs, startups           | Agencies, enterprises |

## 1.3 Business Objectives

1. **Brand Visibility:** Establish GT Group as global education leader
2. **Lead Capture:** Convert website visitors into CRM leads
3. **Service Revenue:** Monetize development expertise via Nexus
4. **Student Support:** Provide self-service portal for current students
5. **Market Expansion:** Reach international audiences

---

# 2. TECHNICAL ARCHITECTURE

## 2.1 Technology Stack

### Frontend

| Technology      | Version | Purpose                |
| --------------- | ------- | ---------------------- |
| Next.js         | 14.2.3  | Framework (App Router) |
| React           | 18      | UI Library             |
| TypeScript      | -       | Type Safety            |
| Tailwind CSS    | -       | Styling                |
| next-intl       | -       | Internationalization   |
| Framer Motion   | -       | Animations             |
| React Hook Form | -       | Form Handling          |
| Zod             | -       | Validation             |

### Backend

| Technology | Purpose             |
| ---------- | ------------------- |
| Supabase   | PostgreSQL Database |
| Node.js    | API Gateway         |
| JWT        | Authentication      |

### DevOps

| Technology | Purpose                |
| ---------- | ---------------------- |
| Turbo      | Monorepo orchestration |
| npm        | Package Manager        |
| Vercel     | Deployment             |

## 2.2 Monorepo Structure

```
gtgroupwebproject/
├── apps/
│   ├── master-portal/     # Corporate Hub (Port 3000)
│   ├── study-consultancy/ # Education Platform (Port 3001)
│   └── nexus-digital/     # Digital Agency (Port 3002)
├── packages/
│   ├── api-gateway/       # Node.js API module
│   └── shared-ui/         # React component library
├── turbo.json             # Turborepo config
└── package.json           # Root package.json
```

## 2.3 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB APPLICATIONS                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │   Master     │ │    Study     │ │    Nexus    │        │
│  │   Portal     │ │ Consultancy  │ │   Digital   │        │
│  │  (Port 3000) │ │ (Port 3001)  │ │ (Port 3002) │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │  API Gateway │                          │
│                   │   (Node.js)  │                          │
│                   └──────┬──────┘                           │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    SUPABASE DATABASE                        │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │  Students  │ │ Appoint-   │ │  Website   │               │
│  │   (Leads)  │ │  ments     │ │   Content  │               │
│  └────────────┘ └────────────┘ └────────────┘               │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐               │
│  │ Destina-   │ │ Universities│ │  Events   │               │
│  │   tions    │ │            │ │            │               │
│  └────────────┘ └────────────┘ └────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

## 2.4 Shared Package: API Gateway

### Modules

| Module            | Function                          | Endpoints              |
| ----------------- | --------------------------------- | ---------------------- |
| `leads.js`        | Convert web forms to CRM students | POST /api/leads        |
| `appointments.js` | Book consultations                | POST /api/appointments |
| `stats.js`        | Aggregate placement data          | GET /api/stats         |
| `newsletter.js`   | Email subscriptions               | POST /api/newsletter   |
| `payments.js`     | Process demo payments             | POST /api/payments     |
| `website.js`      | Fetch testimonials, news, team    | GET /api/content       |

## 2.5 Shared Package: Shared UI

### Components (18 Total)

| Category    | Components                               |
| ----------- | ---------------------------------------- |
| **Forms**   | Input, Select, DatePicker, FileUpload    |
| **Buttons** | Button, IconButton, LoadingButton        |
| **Cards**   | Card, StatCard, TestimonialCard          |
| **Display** | Carousel, Badge, Avatar                  |
| **Layout**  | Container, Section, Grid                 |
| **Special** | CourseCard, EventCard, Tracker, AIWidget |

---

# 3. APPLICATION DETAILS

## 3.1 Master Portal (Port 3000)

### Purpose

Corporate hub for GT Group brand presence

### Pages & Features

| Page             | Features                               |
| ---------------- | -------------------------------------- |
| **Home**         | Hero section, stats, testimonials, CTA |
| **About**        | Company story, mission, vision         |
| **Team**         | Staff directory with profiles          |
| **News**         | Blog feed, articles                    |
| **Testimonials** | Success stories carousel               |
| **Statistics**   | Live data dashboard                    |
| **Contact**      | Contact form, office info              |

### Statistics Displayed

- ✅ 5,000+ Students Placed
- ✅ 200+ Partner Universities
- ✅ 98% Visa Success Rate
- ✅ 4 Global Offices

### Design Features

- Corporate branding
- Professional imagery
- Responsive design
- Multi-language support

---

## 3.2 Study Consultancy App (Port 3001)

### Purpose

Student-facing education platform for lead generation and student support

### Pages & Features

| Page                | Features                                   |
| ------------------- | ------------------------------------------ |
| **Home**            | Hero, search, featured courses, stats      |
| **Universities**    | 200+ partner institutions, filters, search |
| **Courses**         | IELTS, TOPIK, Language, Consultation       |
| **Destinations**    | Study abroad countries (4+)                |
| **Events**          | Webinars, consultations, registration      |
| **Apply**           | Multi-step application form                |
| **Visa**            | Country-specific visa guidance             |
| **Tracking**        | Application status monitoring              |
| **Success Stories** | Student testimonials                       |
| **Scholarships**    | Available funding options                  |

### University Database

- **Total Partners:** 200+
- **Countries:** UK, USA, Canada, Australia, Germany, Japan, Korea, Singapore
- **Filters:** Country, program, tuition range, ranking

### Course Offerings

| Course            | Description            | Price Range |
| ----------------- | ---------------------- | ----------- |
| IELTS Preparation | Test preparation       | $200-500    |
| TOPIK             | Korean language test   | $200-400    |
| Language Courses  | English, Korean, other | $150-300    |
| Consultation      | Expert counseling      | $50-150     |

### Destination Countries

| Country     | Flag | Popular Programs     |
| ----------- | ---- | -------------------- |
| South Korea | 🇰🇷   | Language, University |
| Bangladesh  | 🇧🇩   | School, University   |
| Sri Lanka   | 🇱🇰   | School, University   |
| Vietnam     | 🇻🇳   | Language, University |

### Events System

| Event Type   | Description         |
| ------------ | ------------------- |
| Webinar      | Online presentation |
| Consultation | 1-on-1 meeting      |
| Registration | Event sign-up       |

---

## 3.3 Nexus Digital (Port 3002)

### Purpose

Digital agency for external client services

### Pages & Features

| Page          | Features               |
| ------------- | ---------------------- |
| **Home**      | Services overview, CTA |
| **Services**  | Detailed service list  |
| **Portfolio** | Case studies, projects |
| **About**     | Agency story, team     |
| **Contact**   | Quote request form     |

### Service Offerings

| Service           | Description      | Price Range     |
| ----------------- | ---------------- | --------------- |
| Web Development   | Custom websites  | $500-$15,000    |
| E-commerce        | Online stores    | $5,000-$20,000  |
| Mobile Apps       | iOS/Android      | $10,000-$50,000 |
| Digital Marketing | SEO, ads, social | $500-$2,000/mo  |
| UI/UX Design      | Design systems   | $1,000-$5,000   |
| Brand Identity    | Logos, branding  | $500-$3,000     |

### Portfolio Showcase

- Internal projects (GT Group platforms)
- Client case studies
- Service demonstrations

---

# 4. SHARED INFRASTRUCTURE

## 4.1 Database Integration

### Shared Tables

| Table                    | Usage          | Application   |
| ------------------------ | -------------- | ------------- |
| `students`               | Lead records   | All 3 apps    |
| `appointments`           | Bookings       | Study, Nexus  |
| `destinations`           | Countries      | Study         |
| `offices`                | Locations      | All 3 apps    |
| `newsletter_subscribers` | Email list     | All 3 apps    |
| `payments`               | Transactions   | Study, Nexus  |
| `news_posts`             | Blog content   | Master, Study |
| `testimonials`           | Reviews        | All 3 apps    |
| `team_members`           | Staff profiles | Master, Study |
| `events`                 | Event listings | Study         |

## 4.2 Authentication

### System

- **Provider:** Supabase Auth
- **Method:** JWT tokens
- **Flow:**
  1. User registers/logs in
  2. Token generated
  3. Token stored in cookie
  4. Middleware validates on each request

### Public vs Protected Routes

| Route Type   | Access    |
| ------------ | --------- |
| `/` (Home)   | Public    |
| `/about`     | Public    |
| `/contact`   | Public    |
| `/apply`     | Public    |
| `/dashboard` | Protected |
| `/profile`   | Protected |

## 4.3 Internationalization

### Implementation

- **Library:** next-intl
- **Supported Locales:** English + local languages
- **Structure:** `/locales/{locale}/common.json`

### Translated Content

- Navigation menus
- Form labels
- Button text
- Error messages
- Page content

---

# 5. LEAD GENERATION SYSTEM

## 5.1 Lead Flow Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Website   │     │ API Gateway │     │     CRM     │
│   Visitor   │────▶│             │────▶│  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │ Form Fill         │ Transform          │ Create
       │                   │                    │ Record
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Contact    │     │  Validate   │     │  Pipeline   │
│  Form       │     │  & Route    │     │  "New Lead" │
└─────────────┘     └─────────────┘     └─────────────┘
```

## 5.2 Lead Form Fields

### Contact Form

| Field             | Type     | Required |
| ----------------- | -------- | -------- |
| Full Name         | Text     | ✅ Yes   |
| Email             | Email    | ✅ Yes   |
| Phone             | Phone    | ✅ Yes   |
| Country           | Select   | ✅ Yes   |
| Interested Course | Select   | ✅ Yes   |
| Message           | Textarea | ❌ No    |

### Application Form (Multi-step)

| Step           | Fields                         |
| -------------- | ------------------------------ |
| 1. Personal    | Name, DOB, Gender, Nationality |
| 2. Contact     | Phone, Email, Address          |
| 3. Education   | School, Degree, GPA            |
| 4. Preferences | Country, Major, Budget         |
| 5. Documents   | Upload certificates            |
| 6. Review      | Summary & submit               |

## 5.3 Auto-Processing

### CRM Integration

| Action                | Trigger          |
| --------------------- | ---------------- |
| Create Student Record | Form submission  |
| Set Source            | "Website"        |
| Set Office            | Based on country |
| Set Pipeline Status   | "new_lead"       |
| Assign Counselor      | Auto-route       |

### Lead Source Tracking

| Source    | Value         |
| --------- | ------------- |
| Website   | Direct visit  |
| Google    | Search        |
| Facebook  | Social ad     |
| Instagram | Social post   |
| Referral  | Word-of-mouth |

---

# 6. INTEGRATION POINTS

## 6.1 Website → CRM

### Data Flow

| Direction | Data                 | Frequency |
| --------- | -------------------- | --------- |
| Web → CRM | Lead submissions     | Real-time |
| CRM → Web | Content updates      | Scheduled |
| Web → CRM | Appointment bookings | Real-time |
| CRM → Web | Statistics           | Real-time |

### API Endpoints

```
POST /api/leads
  Input: { name, email, phone, country, course, message }
  Output: { success, studentId }

POST /api/appointments
  Input: { studentId, type, date, time, notes }
  Output: { success, appointmentId }

GET /api/stats
  Output: { students, universities, successRate }

POST /api/newsletter
  Input: { email, name }
  Output: { success }
```

## 6.2 Payment Integration

### Current Status

- **Demo Mode:** Active
- **Production:** Ready (needs Stripe keys)

### Payment Flow

```
User selects service
    │
    ▼
Fill payment form
    │
    ▼
Submit to /api/payments
    │
    ▼
Store in database
    │
    ▼
Display confirmation
```

### Supported Payments

| Method         | Status |
| -------------- | ------ |
| Credit Card    | Demo   |
| Bank Transfer  | Demo   |
| Mobile Banking | Demo   |

## 6.3 Email Integration

### Newsletter System

- **Subscription Form:** Embedded in websites
- **Storage:** `newsletter_subscribers` table
- **Management:** CRM admin panel
- **Sending:** Via CRM email system

### Automated Emails

| Trigger              | Recipient  | Purpose      |
| -------------------- | ---------- | ------------ |
| Form Submit          | Student    | Confirmation |
| Appointment Booked   | Student    | Reminder     |
| Newsletter Subscribe | Subscriber | Welcome      |

---

# 7. BUSINESS MODEL

## 7.1 Revenue Channels

| Channel               | Application       | Description                    |
| --------------------- | ----------------- | ------------------------------ |
| **Course Sales**      | Study Consultancy | IELTS, TOPIK, language classes |
| **Consultation Fees** | Study Consultancy | Paid advising sessions         |
| **Lead Generation**   | Study Consultancy | Students to CRM                |
| **Service Sales**     | Nexus Digital     | Web dev, marketing services    |
| **Scholarships**      | Study Consultancy | Partner funding (referral)     |

## 7.2 Value Propositions

### For Students

| Value       | Description                   |
| ----------- | ----------------------------- |
| Convenience | 24/7 access to information    |
| Speed       | Instant response to inquiries |
| Choice      | 200+ university options       |
| Support     | Application tracking          |
| Trust       | 98% success rate              |

### For External Clients (Nexus)

| Value     | Description                  |
| --------- | ---------------------------- |
| Expertise | Proven internal track record |
| Cost      | Lower than agencies          |
| Speed     | Fast turnaround              |
| Support   | Ongoing maintenance          |
| Quality   | Professional results         |

---

# 8. REVENUE STREAMS

## 8.1 Study Consultancy Revenue

### Current Metrics

| Metric                | Value       |
| --------------------- | ----------- |
| Monthly Leads         | 500+        |
| Conversion Rate       | 25-35%      |
| Average Student Value | $640        |
| Annual Revenue        | $3,200,000+ |

### Revenue Breakdown

| Service      | Price    | Volume | Annual     |
| ------------ | -------- | ------ | ---------- |
| Consultation | $100-200 | 2,000  | $300,000   |
| Application  | $200-500 | 1,500  | $525,000   |
| Visa Service | $300-800 | 1,000  | $600,000   |
| Courses      | $200-500 | 1,500  | $525,000   |
| Other        | $100-300 | 4,000  | $1,250,000 |

## 8.2 Nexus Digital Revenue

### Service Pricing

| Service      | Basic   | Standard | Premium |
| ------------ | ------- | -------- | ------- |
| Website      | $500    | $2,000   | $5,000  |
| E-commerce   | $3,000  | $8,000   | $15,000 |
| Mobile App   | $10,000 | $25,000  | $50,000 |
| Marketing/mo | $500    | $1,000   | $2,000  |

### Target Clients

| Industry    | Potential |
| ----------- | --------- |
| Education   | 30%       |
| Real Estate | 20%       |
| Retail      | 15%       |
| Healthcare  | 10%       |
| Other       | 25%       |

---

# 9. NEXUS DIGITAL AGENCY

## 9.1 Agency Overview

### Mission

Monetize GT Group's development expertise by offering digital services to external clients.

### Value Proposition

- **Internal Proof:** Our platforms demonstrate capability
- **Cost Advantage:** Lower overhead than traditional agencies
- **Speed:** Faster delivery due to existing infrastructure
- **Quality:** Enterprise-grade results

## 9.2 Service Catalog

### Development Services

| Service         | Description          | Timeline    |
| --------------- | -------------------- | ----------- |
| Static Websites | 5-10 page sites      | 1-2 weeks   |
| CMS Websites    | WordPress, custom    | 2-4 weeks   |
| E-commerce      | Stores with payments | 4-8 weeks   |
| Web Apps        | Custom applications  | 8-16 weeks  |
| Mobile Apps     | iOS/Android          | 12-24 weeks |

### Marketing Services

| Service      | Description         | Timeline |
| ------------ | ------------------- | -------- |
| SEO          | Search optimization | Ongoing  |
| Social Media | Management          | Ongoing  |
| Content      | Blog, copy          | Weekly   |
| Ads          | Google, Facebook    | Ongoing  |

### Design Services

| Service             | Description            | Timeline  |
| ------------------- | ---------------------- | --------- |
| UI/UX Design        | Wireframes, prototypes | 1-2 weeks |
| Brand Identity      | Logos, guidelines      | 1-2 weeks |
| Marketing Materials | Flyers, brochures      | 1 week    |

## 9.3 Client Acquisition Strategy

### Phase 1: Local Market (2026)

- Target: GT Group existing network
- Channels: Referrals, social media
- Goal: 10-15 clients

### Phase 2: Regional Expansion (2027)

- Target: South Korea SMBs
- Channels: Digital marketing, partnerships
- Goal: 25-30 clients

### Phase 3: International (2028)

- Target: Global clients
- Channels: Agency partnerships, Upwork
- Goal: 50+ clients

## 9.4 Revenue Projections

| Year | Target Revenue | Clients | Avg Value |
| ---- | -------------- | ------- | --------- |
| 2026 | $30,000        | 10-15   | $2,500    |
| 2027 | $75,000        | 25-30   | $2,700    |
| 2028 | $150,000       | 50+     | $3,000    |

---

# 10. FUTURE ROADMAP

## 10.1 Immediate Priorities (Q2 2026)

### Technology

- [ ] Complete Stripe integration
- [ ] Add more payment methods
- [ ] Enhance mobile responsiveness
- [ ] Improve SEO

### Content

- [ ] Add 50 more universities
- [ ] Create video content
- [ ] Expand scholarship database
- [ ] Multi-language expansion

### Marketing

- [ ] Launch Google Ads campaign
- [ ] Social media strategy
- [ ] Content marketing plan
- [ ] Email newsletter

## 10.2 Medium-Term Goals (Q4 2026)

### Features

- [ ] Student portal mobile app
- [ ] AI chatbot for inquiries
- [ ] Advanced analytics dashboard
- [ ] API for partner institutions

### Nexus Expansion

- [ ] Formalize service packages
- [ ] Create proposal templates
- [ ] Build portfolio case studies
- [ ] Hire sales resource

## 10.3 Long-Term Vision (2027+)

### Platform

- [ ] White-label options for partners
- [ ] AI-powered recommendations
- [ ] Predictive analytics
- [ ] Mobile CRM app

### Business

- [ ] International office expansion
- [ ] Franchise model
- [ ] Strategic partnerships
- [ ] IPO preparation

---

# APPENDICES

## Appendix A: Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# App Ports
MASTER_PORTAL_PORT=3000
STUDY_CONSULTANCY_PORT=3001
NEXUS_DIGITAL_PORT=3002

# API Keys
RESEND_API_KEY=
STRIPE_PUBLIC_KEY=
```

## Appendix B: File Structure

```
gtgroupwebproject/
├── apps/
│   ├── master-portal/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   └── lib/
│   │   └── package.json
│   ├── study-consultancy/
│   │   ├── src/
│   │   ├── components/
│   │   └── lib/
│   │   └── package.json
│   └── nexus-digital/
│       ├── src/
│       ├── components/
│       └── lib/
│       └── package.json
├── packages/
│   ├── api-gateway/
│   │   ├── src/
│   │   │   ├── leads.js
│   │   │   ├── appointments.js
│   │   │   ├── stats.js
│   │   │   ├── newsletter.js
│   │   │   ├── payments.js
│   │   │   └── website.js
│   │   └── package.json
│   └── shared-ui/
│       ├── src/
│       │   └── components/
│       └── package.json
├── turbo.json
└── package.json
```

## Appendix C: Key URLs

| Application       | Local              | Production |
| ----------------- | ------------------ | ---------- |
| Master Portal     | localhost:3000     | TBD        |
| Study Consultancy | localhost:3001     | TBD        |
| Nexus Digital     | localhost:3002     | TBD        |
| API Gateway       | localhost:3000/api | TBD        |

---

_Document Version: 1.0_
_Last Updated: April 2026_
_Prepared by: GT Group IT Department_
