# GT GROUP CRM 2026 - PROJECT UPDATE SPECIFICATION

## Project Name

GT Group CRM

## Product Type

Multi-Tenant SaaS CRM + SFMS + AI Platform for Study Abroad Agencies & Universities

---

# PROJECT OVERVIEW

GT Group CRM is an All-In-One SaaS Platform designed specifically for:

- Study Abroad Agencies
- Universities
- Education Consultants
- Student Counselors
- GT Group Internal Team

The platform connects Agencies, Universities, Students, and GT Group into one centralized ecosystem.

---

# CORE BUSINESS MODEL

The platform operates as a Multi-Tenant SaaS.

### Tenant Types

1. GT Group Super Admin
2. Study Abroad Agency
3. University
4. Agency Staff
5. University Staff

---

# SUBSCRIPTION PLANS

## GO PLAN

Price:

- $79 / 4 Months

Features:

- Student Quota: 1 - 7
- Staff Accounts: 2
- CRM Access
- SFMS Access
- Office Management
- Financial Management
- GT AI Access
- Human Document Analysis
- Marketing Support
- GT Social Access
- Event Access
- Chat System

---

## UP PLAN

Price:

- $139 / 4 Months

Features:

- Student Quota: 5 - 13
- Staff Accounts: 5
- GT AI Basic
- AI Document Analysis (10 Students)
- Office CCTV (6 Cameras)
- CRM Access
- SFMS Access
- Financial Management
- Marketing Support
- Event Access
- Chat System

---

## MAX PLAN

Price:

- $199 / 4 Months

Features:

- Student Quota: 8 - 25
- Staff Accounts: 13
- GT AI Advanced
- AI Document Analysis (25 Students)
- Office CCTV (15 Cameras)
- CRM Access
- SFMS Access
- Financial Management
- Event Access
- Chat System

---

# PLATFORM MODULES

---

## 1. STUDENT FILE MANAGEMENT SYSTEM (SFMS)

Purpose:

Manage entire student lifecycle.

Pipeline:

Lead
→ Counseling
→ Documents Collection
→ Application Preparation
→ University Submission
→ Offer Letter
→ Tuition Payment
→ Visa Processing
→ Visa Approval
→ Departure
→ Completed

Features:

- Student Profile
- Document Repository
- Application Tracking
- Visa Tracking
- Timeline
- Notes
- Activity Log
- Tasks
- Communication History

---

## 2. CUSTOMER RELATIONSHIP MANAGEMENT (CRM)

Purpose:

Manage all student and customer relationships.

Features:

- Lead Management
- Sales Pipeline
- Follow-up Reminders
- Communication Tracking
- Contact Management
- Task Assignment
- Counselor Dashboard
- Agency Dashboard

---

## 3. UNIVERSITY APPLICATION MANAGEMENT

Workflow:

Agency
→ GT Group Review
→ University

Features:

- Application Submission
- Admission Tracking
- Offer Letter Tracking
- University Dashboard
- Application Status Timeline
- Agency-University Communication

Status Types:

- Draft
- Submitted
- Under Review
- Additional Documents Required
- Accepted
- Rejected
- Offer Issued
- Enrolled

---

## 4. FINANCIAL MANAGEMENT SYSTEM

Features:

### Agency Finance

- Income Tracking
- Expense Tracking
- Student Payments
- Commission Tracking
- Revenue Dashboard

### Reports

- Daily
- Weekly
- Monthly
- Yearly

Export Formats:

- PDF
- Excel

Charts:

- Revenue Growth
- Expense Analysis
- Profit/Loss
- Student Revenue

---

## 5. OFFICE MANAGEMENT SYSTEM

Features:

### HR

- Employee Management
- Attendance
- Leave Management
- Roles & Permissions

### Staff

- Check-In
- Check-Out
- Work Logs
- Performance Tracking

---

## 6. OFFICE CCTV MANAGEMENT

Plan Limits:

GO:
No CCTV

UP:
6 Cameras

MAX:
15 Cameras

Features:

- Live Streaming
- Camera Dashboard
- Camera Monitoring
- Multi-Camera Layout
- Recording Status

---

## 7. GT AI PLATFORM

Architecture:

Multi-Agent AI System
Models:

- OpenAI
- Claude
- Gemini
- DeepSeek
- Llama
- OpenRouter Models

---

### GT AI FEATURES

#### SOP Generator

Generate:

- SOP
- Study Plan
- Self Introduction

---

#### Resume Builder

Generate:

- Resume
- CV
- Cover Letter

---

#### University Form Assistant

Auto Fill:

- Admission Forms
- Scholarship Forms
- Visa Forms

Using Student CRM Data.

---

#### Student Advisor AI

Provide:

- University Suggestions
- Country Suggestions
- Scholarship Recommendations
- Admission Guidance

---

# AI DOCUMENT ANALYSIS SYSTEM

Purpose:

Automatically analyze student documents.

Documents:

- Passport
- SSC Certificate
- HSC Certificate
- Bachelor Degree
- Transcript
- Birth Certificate
- National ID
- Family Certificate
- Bank Statement
- Income Certificate
- TIN Certificate
- Trade License
- NOC
- Police Clearance

---

## AI ANALYSIS FEATURES

Extract:

- Name
- Date of Birth
- Passport Number
- National ID Number
- Address
- Academic Information

Compare Across Documents:

Detect:

- Name Mismatch
- Date Mismatch
- Number Mismatch
- Missing Information
- Invalid Documents

Output:

- Error Report
- Risk Score
- Suggested Fixes
- Missing Documents List

Target Accuracy:
99%+

Technology:

- OCR
- LayoutLM
- OpenRouter Models
- Vision AI

---

# HUMAN DOCUMENT REVIEW SYSTEM

Purpose:

GT Group Expert Counselors manually review student files.

Workflow:

Student Documents
→ GT Expert Review
→ Review Report
→ Approval

Features:

- Review Notes
- Error Marking
- Recommendations
- Final Approval

---

# GT SOCIAL MODULE

Features:

- Marketing Assets
- Templates
- Reels Ideas
- Campaign Content
- Success Story Promotion

Agency Benefits:

- Featured Agency Listing
- Social Media Highlight
- Student Success Promotion

---

# MARKETING SUPPORT MODULE

Features:

- AI Image Generation
- Ad Copy Generation
- Campaign Planner
- Social Media Content Generator

GT Team Support:

- Marketing Consultation
- Campaign Strategy
- Ad Review

---

# EVENTS & EXPO MODULE

Features:

- Event Registration
- Expo Registration
- Ticket Management
- Event Calendar
- Exclusive Invitations

---

# INTERNAL CHAT SYSTEM

Features:

- Real-Time Messaging
- Group Chat
- File Sharing
- Voice Notes
- Read Receipts

Security:

- End-to-End Encryption

Communication Types:

- Staff ↔ Staff
- Agency ↔ GT Group
- University ↔ GT Group

---

# UNIVERSITY PORTAL

Universities receive:

Free Access for 6 Months

After 6 Months:

$149/month Subscription

Features:

- Student Applications
- Admission Dashboard
- Application Review
- Offer Letter Upload
- Student Status Tracking

---

# ROLE & PERMISSION SYSTEM

Roles:

- Super Admin
- GT Admin
- GT Counselor
- Agency Owner
- Agency Manager
- Agency Staff
- University Admin
- University Officer

Use RBAC Architecture.

---

# MULTI-TENANT REQUIREMENTS

Every Agency Must Have:

- Isolated Database Records
- Separate Students
- Separate Staff
- Separate Finances

All data protected through Tenant ID.

---

# NOTIFICATION SYSTEM

Channels:

- In-App
- Email
- SMS
- WhatsApp

Events:

- Application Updates
- Document Issues
- Admission Results
- Payment Alerts

---

# REPORTING & ANALYTICS

Dashboards:

Agency Dashboard
University Dashboard
GT Group Dashboard

KPIs:

- Student Applications
- Conversion Rate
- Visa Success Rate
- Revenue
- Staff Productivity
- University Performance

---

# TECHNOLOGY STACK

Frontend:

- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Shadcn UI

Backend:

- NestJS
- Node.js
- python for crm software backend
-

Database:

- Supabase PostgreSQL

Cache:

- Redis

Storage:

- S3 Compatible Storage

Realtime:

- WebSockets

Authentication:

- JWT
- RBAC

AI:

- OpenRouter
- OpenAI
- Claude
- Gemini
- DeepSeek
- LayoutLM

Deployment:

- Docker
- Kubernetes
- CI/CD

---

# SUCCESS METRIC

Create the most complete Study Abroad CRM ecosystem in Bangladesh and internationally, connecting Agencies, Universities, Students, and GT Group through a unified AI-powered SaaS platform.
