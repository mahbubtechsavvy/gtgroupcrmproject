# 🔗 CRM → Website Integration — Part 3
## Scalability, Implementation Phases & Delivery Checklist

---

## 1. Scalability Strategy (120,000 Files/Year)

### Database Tier

| Scale Point | Strategy |
|---|---|
| 120K student records/year | Indexed queries, pagination (never fetch all) |
| 500K+ DB rows | Table partitioning by `created_at` year after 2M rows |
| Large file uploads | Supabase Storage → Cloudflare CDN |
| Heavy read traffic | ISR (60s cache) + Edge caching |
| Newsletter 50K/month | Batched Edge Function, 100/batch, queued |
| 4 offices concurrent | `office_id` RLS filters — each office sees own data |
| Search across 10K unis | Full-text search index `tsvector` on name, description |
| Real-time dashboard | Supabase Realtime subscriptions (websocket) |
| Image optimization | Next.js Image + WebP/AVIF + Supabase Image Transform |

### Full-Text Search (for Universities, Blog, FAQ)

```sql
-- Add tsvector column for fast full-text search
ALTER TABLE public.web_universities
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,''))
  ) STORED;

CREATE INDEX idx_universities_search ON public.web_universities USING gin(search_vector);

-- Search query example:
SELECT * FROM web_universities
WHERE search_vector @@ plainto_tsquery('english', 'engineering Seoul')
ORDER BY ts_rank(search_vector, plainto_tsquery('engineering Seoul')) DESC;
```

### Storage Strategy

```
Supabase Storage Buckets:
├── website-public/           (public bucket, CDN-cached)
│   ├── destinations/         Country hero images, flags
│   ├── universities/         Logos, cover images
│   ├── blog/                 Blog cover images
│   ├── team/                 Staff photos
│   ├── testimonials/         Student photos, video thumbnails
│   ├── partners/             Partner logos
│   ├── events/               Event covers
│   └── courses/              Course covers
│
└── student-private/          (private bucket, signed URLs)
    ├── applications/         Application documents
    ├── passports/            Passport copies (encrypted)
    └── transcripts/          Academic transcripts
```

### ISR (Incremental Static Regeneration) Strategy

```typescript
// Each website page uses ISR for performance + freshness balance
export const revalidate = 60; // seconds

// High-traffic pages (Homepage, Destinations) → 60s cache
// Blog posts, Events → 60s cache  
// Visa tracking → 0 (always fresh, server-rendered)
// Legal pages → 3600s (1hr cache)
// FAQ → 300s (5min cache)
// Stats counters → 3600s (computed, cached)
```

---

## 2. Implementation Phases

### Phase 1 — Database Foundation (Week 1)

**CRM side:**
- [ ] Run migration `029_website_cms_full.sql`
- [ ] Run migration `030_rls_policies_website.sql`
- [ ] Run migration `031_full_text_search.sql`
- [ ] Create Supabase Storage buckets
- [ ] Seed sample data for all new tables

**Test:**
- [ ] All tables created, RLS working
- [ ] Public can SELECT published rows
- [ ] CRM staff can INSERT/UPDATE/DELETE

---

### Phase 2 — API Gateway Extensions (Week 1-2)

**In `packages/api-gateway/src/`:**
- [ ] `destinations.js` — getAll, getBySlug, getFeatured
- [ ] `universities.js` — getAll (with filters), getBySlug, getByDestination
- [ ] `scholarships.js` — getAll (with filters)
- [ ] `partners.js` — getAll active
- [ ] `faqs.js` — getAll, getByCategory
- [ ] `offices.js` — getAll published
- [ ] `applications.js` — submit, getStatus by trackingId
- [ ] `appointments.js` — create
- [ ] `legal.js` — getByType
- [ ] `stats.js` — cached aggregate counts
- [ ] Update `index.js` exports
- [ ] Update TypeScript definitions

---

### Phase 3 — CRM Website Manager Modules (Week 2-3)

**New CRM pages in `gtgroupcrmproject/src/app/website/`:**
- [ ] `destinations/page.jsx` — CRUD with image upload
- [ ] `universities/page.jsx` — CRUD linked to destinations
- [ ] `scholarships/page.jsx` — CRUD with deadline alerts
- [ ] `partners/page.jsx` — Logo manager, drag to reorder
- [ ] `faq/page.jsx` — Q&A manager, drag to reorder, category tabs
- [ ] `appointments/page.jsx` — Booking inbox, assign counselor
- [ ] `applications/page.jsx` — Application inbox, pipeline conversion
- [ ] `newsletters/page.jsx` — Campaign composer, segment, send/schedule
- [ ] `legal/page.jsx` — Rich HTML editor, version control
- [ ] `visa/page.jsx` — Per-country visa guide editor

**Enhanced existing CRM pages:**
- [ ] `news/page.jsx` — Add rich editor, SEO fields, image upload
- [ ] `events/page.jsx` — Add registrations view, capacity tracking
- [ ] `courses/page.jsx` — Add enrollment list, featured toggle
- [ ] `team/page.jsx` — Add slug, social links, sort order
- [ ] `testimonials/page.jsx` — Add photo upload, office filter, video URL
- [ ] `subscribers/page.jsx` — Add campaign history, segment stats

**Shared CMS Components:**
- [ ] `ContentEditor.jsx` — TipTap rich text editor
- [ ] `ImageUploader.jsx` — Supabase Storage upload with preview
- [ ] `SlugGenerator.jsx` — Auto-generate, editable, uniqueness check
- [ ] `SEOFields.jsx` — title/description with character count
- [ ] `PublishToggle.jsx` — Draft/Published with date
- [ ] `SortableList.jsx` — Drag-to-reorder using @dnd-kit
- [ ] `FormSubmissionInbox.jsx` — Appointments + Applications inbox

---

### Phase 4 — Website Pages (Week 3-5)

**New pages in `apps/study-consultancy/app/[locale]/`:**

| Page | Data Source | Priority |
|---|---|---|
| `study-destinations/page.tsx` | web_destinations | P0 |
| `study-destinations/[country]/page.tsx` | web_destinations + universities + scholarships | P0 |
| `universities/page.tsx` | web_universities | P0 |
| `universities/[slug]/page.tsx` | web_universities | P1 |
| `scholarships/page.tsx` | web_scholarships | P0 |
| `blog/page.tsx` | news_posts | P1 |
| `blog/[slug]/page.tsx` | news_posts | P1 |
| `events/page.tsx` | events | P1 |
| `events/[slug]/page.tsx` | events + event_registrations | P1 |
| `success-stories/page.tsx` | testimonials | P0 |
| `team/page.tsx` | team_members | P1 |
| `partners/page.tsx` | web_partners | P1 |
| `faq/page.tsx` | web_faqs | P1 |
| `contact/page.tsx` | offices | P0 |
| `apply/page.tsx` | web_applications | P0 |
| `ielts-coaching/page.tsx` | website_courses (type=ielts) | P1 |
| `topik-coaching/page.tsx` | website_courses (type=topik) | P1 |
| `privacy-policy/page.tsx` | web_legal_pages | P2 |
| `terms/page.tsx` | web_legal_pages | P2 |

**Enhanced existing pages:**
- [ ] `page.tsx` (homepage) — Pull all sections from DB
- [ ] `visa/page.tsx` — Rich visa guides per destination
- [ ] `visa/tracking/page.tsx` — Query students table
- [ ] `book/page.tsx` — Full appointment form → web_appointments
- [ ] `courses/page.tsx` — Filter/search from website_courses

---

### Phase 5 — Animations & Design Polish (Week 5-6)

**Install packages:**
```bash
npm install framer-motion lottie-react embla-carousel-react \
  react-hook-form zod @hookform/resolvers date-fns \
  lucide-react @dnd-kit/core @dnd-kit/sortable \
  @tiptap/react @tiptap/starter-kit sharp
```

**Animation work:**
- [ ] Hero section — Framer Motion parallax + floating elements
- [ ] Stat counters — useCountUp on IntersectionObserver
- [ ] Country cards — Stagger reveal on scroll
- [ ] Testimonial carousel — Embla Carousel + auto-play
- [ ] Page transitions — Framer Motion AnimatePresence
- [ ] Scroll progress bar — CSS + JS scroll event
- [ ] Form steps — Slide animation between steps
- [ ] Loading skeletons — CSS shimmer animation

---

### Phase 6 — SEO, i18n & Performance (Week 6-7)

- [ ] JSON-LD structured data per page type
  - Organization, WebSite, LocalBusiness (offices)
  - Course (all courses), Event (all events)
  - FAQPage, BreadcrumbList, BlogPosting
- [ ] Generate `sitemap.xml` dynamically from DB slugs
- [ ] Generate `robots.txt`
- [ ] Set up hreflang tags for 5 locales
- [ ] Translate all i18n JSON files (en, ko, bn, si, vi)
- [ ] Image optimization — all to WebP/AVIF
- [ ] Bundle analysis — target < 200KB gzipped
- [ ] Lighthouse audit — target 90+ all metrics
- [ ] Core Web Vitals — LCP < 2.5s, CLS < 0.1

---

### Phase 7 — Subdomains & Production Deploy (Week 7-8)

- [ ] Configure Vercel for subdomain routing
  - `study.gtgroup.com` — main
  - `bd.study.gtgroup.com` — Bangladesh office
  - `kr.study.gtgroup.com` — South Korea office
  - `lk.study.gtgroup.com` — Sri Lanka office
  - `vn.study.gtgroup.com` — Vietnam office
- [ ] Each subdomain detects locale from hostname
- [ ] Each subdomain shows local office info prominently
- [ ] Environment variables for each environment
- [ ] Run production Supabase migrations
- [ ] Seed production data
- [ ] Set up monitoring (Vercel Analytics + Supabase logs)
- [ ] Final QA on all devices (mobile, tablet, laptop, desktop)

---

## 3. Complete CRM Side Navigation Update

```
CRM Sidebar — Website Section:
┌─────────────────────────────────┐
│ 🌐 WEBSITE MANAGER              │
│                                 │
│  📝 Blog & News                 │
│  📅 Events                      │
│  🎓 Courses                     │
│  💬 Testimonials                │
│  👥 Team Members                │
│  🌍 Destinations (Countries)    │  ← NEW
│  🏛️ Universities                 │  ← NEW
│  🎯 Scholarships                │  ← NEW
│  🤝 Partners                    │  ← NEW
│  ❓ FAQ                         │  ← NEW
│  📧 Newsletter Campaigns        │  ← NEW
│  📬 Appointments (Bookings)     │  ← NEW
│  📋 Online Applications         │  ← NEW
│  🛂 Visa Guides                 │  ← NEW
│  ⚖️ Privacy & Terms             │  ← NEW
│  👥 Subscribers                 │
└─────────────────────────────────┘
```

---

## 4. Delivery Checklist (100-Point QA)

### Database ✅
- [ ] All 17 new tables created
- [ ] All indexes applied
- [ ] RLS policies active for all tables
- [ ] Realtime enabled for public content tables
- [ ] Storage buckets created with correct policies
- [ ] Seed data: 5+ destinations, 20+ unis, 10+ team, 5+ blog posts

### CRM ✅
- [ ] 10 new website manager pages working
- [ ] All existing pages enhanced
- [ ] Image upload to Supabase Storage
- [ ] Rich text editor for blog/content
- [ ] Newsletter campaign send tested
- [ ] Application inbox working
- [ ] Appointment inbox with status update
- [ ] One-click "Convert to Student" from application

### Website ✅
- [ ] All 26 pages live with real data
- [ ] No empty pages — every page has content
- [ ] Responsive: mobile ✓ tablet ✓ laptop ✓ desktop ✓
- [ ] All forms submit correctly
- [ ] Tracking ID works for applications
- [ ] Visa tracking works with Student ID + DOB
- [ ] All animations smooth (no jank)
- [ ] Images all WebP format
- [ ] All meta tags correct
- [ ] JSON-LD structured data valid
- [ ] Sitemap auto-generated
- [ ] Lighthouse: Performance 90+, SEO 100, A11y 95+

### Integration ✅
- [ ] CRM publish → Website updates within 60s (ISR)
- [ ] Newsletter sends to real subscribers
- [ ] Appointment booked → CRM notification
- [ ] Application submitted → CRM inbox + auto-email
- [ ] Event registration → Count updates in CRM
- [ ] Course enrollment → List in CRM

### Subdomains ✅
- [ ] bd.study.gtgroup.com shows Bangladesh content
- [ ] kr.study.gtgroup.com shows Korea content
- [ ] lk.study.gtgroup.com shows Sri Lanka content
- [ ] vn.study.gtgroup.com shows Vietnam content
- [ ] Each shows local office address/phone
- [ ] hreflang correctly set for each locale

---

## 5. Technology Stack Summary

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | Next.js 14 (App Router) | Website framework |
| Styling | CSS Variables + Vanilla CSS | Brand design system |
| Animations | Framer Motion + Lottie | Smooth interactions |
| CRM Frontend | Next.js 14 (JSX) | Admin panel |
| Database | Supabase (PostgreSQL) | Single source of truth |
| Auth | Supabase Auth | CRM staff login |
| Storage | Supabase Storage + CDN | Images & files |
| Email | Gmail API (existing) | Newsletter + notifications |
| Search | PostgreSQL FTS (tsvector) | In-site search |
| Caching | Next.js ISR (60s) | Performance |
| Deployment | Vercel | Website + CRM |
| Monitoring | Vercel Analytics | Traffic + errors |
| Forms | React Hook Form + Zod | Validation |
| Rich Editor | TipTap | Blog/content editing |
| Drag & Drop | @dnd-kit | FAQ/partner ordering |
| i18n | next-intl | 5 languages |
| Carousel | Embla Carousel | Testimonials/galleries |
