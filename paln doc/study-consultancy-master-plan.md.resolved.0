# 🏆 GT Study Abroad Consultancy — 100x Master Redesign Plan

> **Project**: `apps/study-consultancy` | **Stack**: Next.js 14 + next-intl + Supabase + Framer Motion
> **Goal**: World-class, multi-subdomain, data-driven study abroad website

---

## 1. Brand Color System

| Token | Hex | Role |
|---|---|---|
| `--brand-gold` | `#EFB748` | Primary CTA, highlights |
| `--brand-gold-light` | `#F1DA7C` | Hover states, subtle accents |
| `--brand-dark` | `#181A19` | Headings, dark sections |
| `--brand-charcoal` | `#3F434C` | Body text, secondary |
| `--brand-white` | `#FFFFFF` | Backgrounds, cards |
| `--brand-amber` | `#E6BC32` | Badges, icons, secondary CTA |

### Light Theme Palette (International Standard)

```
Background:       #FFFFFF
Surface/Card:     #F8F9FA
Border:           #E8E8E8
Text Primary:     #181A19
Text Secondary:   #3F434C
Text Muted:       #6B7280
Accent Primary:   #EFB748
Accent Hover:     #E6BC32
Accent Light BG:  #FDF8EC (gold at 8% opacity)
Success:          #10B981
Warning:          #F59E0B
Error:            #EF4444
Info:             #3B82F6
```

---

## 2. Architecture Overview

```
study-consultancy/          ← Main domain: study.gtgroup.com
├── app/
│   ├── [locale]/           ← en, ko, bn, si, vi
│   │   ├── layout.tsx
│   │   ├── page.tsx                    ← Homepage
│   │   ├── about/page.tsx              ← About Us
│   │   ├── services/page.tsx           ← All Services
│   │   ├── study-destinations/
│   │   │   ├── page.tsx                ← All Countries Grid
│   │   │   └── [country]/page.tsx      ← Country Detail
│   │   ├── universities/
│   │   │   ├── page.tsx                ← University Explorer
│   │   │   └── [slug]/page.tsx         ← University Detail
│   │   ├── courses/
│   │   │   ├── page.tsx                ← All Courses
│   │   │   └── [slug]/page.tsx         ← Course Detail
│   │   ├── scholarships/page.tsx       ← Scholarship Finder
│   │   ├── visa/
│   │   │   ├── page.tsx                ← Visa Guide Hub
│   │   │   └── tracking/page.tsx       ← Student Tracking
│   │   ├── ielts-coaching/page.tsx     ← IELTS Prep
│   │   ├── topik-coaching/page.tsx     ← TOPIK Prep
│   │   ├── blog/
│   │   │   ├── page.tsx                ← Blog Listing
│   │   │   └── [slug]/page.tsx         ← Blog Post
│   │   ├── events/
│   │   │   ├── page.tsx                ← Events Calendar
│   │   │   └── [slug]/page.tsx         ← Event Detail
│   │   ├── success-stories/page.tsx    ← Testimonials
│   │   ├── team/page.tsx               ← Our Team
│   │   ├── partners/page.tsx           ← Partner Universities
│   │   ├── faq/page.tsx                ← FAQ
│   │   ├── contact/page.tsx            ← Contact Us
│   │   ├── book/page.tsx               ← Book Appointment
│   │   ├── apply/page.tsx              ← Online Application
│   │   ├── privacy-policy/page.tsx     ← Privacy Policy
│   │   └── terms/page.tsx              ← Terms of Service
│   └── api/                            ← API routes for forms
├── components/                         ← Page-specific components
├── lib/                                ← Utilities & Supabase client
├── public/                             ← Static assets
│   └── images/                         ← SEO-named images
└── messages/                           ← i18n JSON files
```

### 4 Country Office Subdomains

| Subdomain | Country | Locale |
|---|---|---|
| `bd.study.gtgroup.com` | Bangladesh (Dhaka) | `bn` |
| `kr.study.gtgroup.com` | South Korea (Seoul) | `ko` |
| `lk.study.gtgroup.com` | Sri Lanka (Colombo) | `si` |
| `vn.study.gtgroup.com` | Vietnam (Hanoi) | `vi` |

Each subdomain shares the same codebase but renders country-specific:
- Local office address, phone, map
- Country-specific popular destinations
- Local testimonials & success stories
- Pricing in local currency
- Language-first content

---

## 3. Complete Page Plan (26 Pages)

> See **Part 2** artifact for full page-by-page breakdown with content specs.

### Quick Page List

| # | Page | Route | Priority |
|---|---|---|---|
| 1 | Homepage | `/` | P0 |
| 2 | About Us | `/about` | P0 |
| 3 | Services | `/services` | P0 |
| 4 | Study Destinations Hub | `/study-destinations` | P0 |
| 5 | Country Detail | `/study-destinations/[country]` | P0 |
| 6 | University Explorer | `/universities` | P0 |
| 7 | University Detail | `/universities/[slug]` | P1 |
| 8 | All Courses | `/courses` | P0 |
| 9 | Course Detail | `/courses/[slug]` | P1 |
| 10 | Scholarship Finder | `/scholarships` | P0 |
| 11 | Visa Guide Hub | `/visa` | P0 |
| 12 | Visa Tracking | `/visa/tracking` | P0 |
| 13 | IELTS Coaching | `/ielts-coaching` | P1 |
| 14 | TOPIK Coaching | `/topik-coaching` | P1 |
| 15 | Blog | `/blog` | P1 |
| 16 | Blog Post | `/blog/[slug]` | P1 |
| 17 | Events | `/events` | P1 |
| 18 | Event Detail | `/events/[slug]` | P2 |
| 19 | Success Stories | `/success-stories` | P0 |
| 20 | Our Team | `/team` | P1 |
| 21 | Partners | `/partners` | P1 |
| 22 | FAQ | `/faq` | P1 |
| 23 | Contact Us | `/contact` | P0 |
| 24 | Book Appointment | `/book` | P0 |
| 25 | Online Application | `/apply` | P0 |
| 26 | Privacy & Terms | `/privacy-policy`, `/terms` | P2 |

---

## 4. Animation & Motion System

### Technology: Framer Motion + CSS Animations

```
Dependencies to add:
- framer-motion@^11
- @react-three/fiber (optional 3D hero)
- lottie-react (for micro-animations)
```

### Animation Tokens

| Animation | Trigger | Duration | Easing |
|---|---|---|---|
| `fadeInUp` | Scroll into view | 0.6s | `ease-out` |
| `fadeInLeft` | Scroll into view | 0.5s | `ease-out` |
| `scaleIn` | Scroll into view | 0.4s | `spring` |
| `staggerChildren` | Parent visible | 0.1s delay each | `ease-out` |
| `parallaxFloat` | Scroll position | Continuous | `linear` |
| `shimmerGold` | Hover/Load | 2s loop | `linear` |
| `countUp` | Scroll into view | 2s | `ease-out` |
| `typewriter` | Page load | Character-based | `steps` |
| `morphBlob` | Continuous | 8s loop | `ease-in-out` |
| `cardHoverLift` | Hover | 0.3s | `spring` |

### Signature Animations

1. **Hero Globe** — 3D rotating globe with flight-path arcs connecting offices
2. **Gold Particle Trail** — Cursor-following gold particles on hero
3. **Counter Stats** — Animated number counters (500+ Universities, 10K+ Students)
4. **Card Hover Lift** — Cards rise with shadow on hover
5. **Smooth Page Transitions** — Slide/fade between routes
6. **Scroll Progress Bar** — Gold gradient bar at top
7. **Parallax Sections** — Background layers move at different speeds
8. **Staggered Grid Reveal** — Cards appear one by one on scroll

---

## 5. Responsive Breakpoints

```css
/* Mobile First */
--bp-sm:   640px;   /* Large phones */
--bp-md:   768px;   /* Tablets */
--bp-lg:   1024px;  /* Laptops */
--bp-xl:   1280px;  /* Desktops */
--bp-2xl:  1536px;  /* Large screens */
```

### Layout Rules

| Element | Mobile | Tablet | Desktop |
|---|---|---|---|
| Nav | Hamburger drawer | Hamburger drawer | Full horizontal |
| Hero | Stack, full-width | Stack, padded | Side-by-side |
| Cards Grid | 1 col | 2 col | 3-4 col |
| Footer | Accordion sections | 2 col | 4 col |
| Sidebar | Hidden/drawer | Visible | Visible + sticky |
| Font Scale | 14-16px base | 16px base | 16-18px base |

---

## 6. SEO Strategy

### File & Image Naming Convention

```
public/images/
├── hero/
│   ├── gt-study-abroad-hero-students-campus.webp
│   ├── gt-study-abroad-hero-globe-animation.webp
│   └── gt-study-abroad-hero-graduation.webp
├── destinations/
│   ├── study-in-south-korea-seoul-campus.webp
│   ├── study-in-japan-tokyo-university.webp
│   ├── study-in-australia-sydney-skyline.webp
│   ├── study-in-uk-london-university.webp
│   ├── study-in-canada-toronto-campus.webp
│   └── study-in-usa-new-york-university.webp
├── courses/
│   ├── ielts-preparation-course-classroom.webp
│   ├── topik-korean-language-course.webp
│   └── english-language-training-program.webp
├── team/
│   ├── gt-group-ceo-profile.webp
│   ├── gt-group-counselor-bangladesh.webp
│   └── gt-group-counselor-korea.webp
├── testimonials/
│   ├── student-success-story-korea-2024.webp
│   └── student-success-story-japan-2024.webp
├── partners/
│   ├── partner-university-logo-seoul-national.webp
│   └── partner-university-logo-tokyo.webp
├── blog/
│   ├── how-to-apply-study-abroad-korea-guide.webp
│   └── ielts-preparation-tips-2024.webp
├── icons/
│   ├── gt-group-favicon-512x512.png
│   ├── gt-group-og-image-1200x630.webp
│   └── country-flag-icons/
│       ├── flag-south-korea.svg
│       ├── flag-bangladesh.svg
│       ├── flag-sri-lanka.svg
│       └── flag-vietnam.svg
└── office/
    ├── gt-group-dhaka-office.webp
    ├── gt-group-seoul-office.webp
    ├── gt-group-colombo-office.webp
    └── gt-group-hanoi-office.webp
```

### Meta Tags Per Page

Each page will have:
- Unique `<title>` with primary keyword + brand
- `<meta description>` 150-160 chars
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags
- Canonical URL
- JSON-LD structured data (Organization, Course, Event, FAQ, BreadcrumbList)
- hreflang tags for all 5 locales

---

## 7. Data Architecture (Supabase)

### Tables Required

```sql
-- Countries/Destinations
destinations (id, name, slug, flag_url, hero_image, description, 
  requirements, living_cost, currency, popular_cities, created_at)

-- Universities  
universities (id, name, slug, country_id, logo_url, cover_image,
  ranking, tuition_range, programs, website, description, created_at)

-- Courses
courses (id, title, slug, type, duration, price, description,
  syllabus, schedule, instructor, max_students, created_at)

-- Scholarships
scholarships (id, title, university_id, country_id, amount,
  deadline, eligibility, description, apply_url, created_at)

-- Blog Posts
blog_posts (id, title, slug, excerpt, content, cover_image,
  author_id, category, tags, published_at, created_at)

-- Events
events (id, title, slug, type, date, time, location, 
  description, registration_url, cover_image, created_at)

-- Testimonials
testimonials (id, student_name, photo_url, country, university,
  program, quote, rating, video_url, created_at)

-- Team Members
team_members (id, name, role, photo_url, bio, 
  office_country, email, linkedin, created_at)

-- Partner Universities
partners (id, name, logo_url, country, website, tier, created_at)

-- FAQ
faqs (id, question, answer, category, sort_order, created_at)

-- Office Locations
offices (id, country, city, address, phone, email, 
  map_embed, working_hours, photo_url, created_at)

-- Applications
applications (id, student_name, email, phone, country,
  destination, program, status, counselor_id, created_at)

-- Appointments  
appointments (id, student_name, email, phone, date, time,
  office_id, type, status, notes, created_at)
```

---

## 8. Component Architecture

> See **Part 3** artifact for detailed component specs.

### Shared Layout Components
- `Header` — Sticky, transparent → solid on scroll, gold accent
- `Footer` — 4-column mega footer with newsletter
- `MobileDrawer` — Slide-in navigation
- `BreadcrumbNav` — SEO breadcrumbs
- `ScrollProgress` — Gold progress bar

### Reusable UI Components
- `HeroSection` — Configurable hero with parallax
- `SectionHeader` — Label + H2 + subtitle pattern
- `StatCounter` — Animated number with label
- `TestimonialCarousel` — Auto-sliding reviews
- `CTABanner` — Gold gradient call-to-action
- `CountryCard` — Flag + name + stats
- `UniversityCard` — Logo + name + ranking
- `CourseCard` — Icon + title + price + CTA
- `BlogCard` — Image + title + excerpt + date
- `EventCard` — Date badge + title + location
- `TeamCard` — Photo + name + role
- `FAQAccordion` — Expandable Q&A
- `ContactForm` — Multi-step with validation
- `AppointmentPicker` — Calendar + time slot
- `SearchFilter` — Filter bar with chips
- `Pagination` — Numbered page navigation
- `SkeletonLoader` — Loading placeholder

---

## 9. Implementation Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Set up design system CSS with brand tokens
- [ ] Install Framer Motion, Lottie
- [ ] Create all shared layout components
- [ ] Create all reusable UI components
- [ ] Set up Supabase tables and seed data
- [ ] Configure subdomain routing

### Phase 2 — Core Pages (Week 3-4)
- [ ] Homepage with all sections
- [ ] About Us
- [ ] Services
- [ ] Study Destinations hub + country detail
- [ ] Contact Us
- [ ] Book Appointment

### Phase 3 — Discovery Pages (Week 5-6)
- [ ] University Explorer + detail
- [ ] Courses + detail
- [ ] Scholarship Finder
- [ ] Visa Guide + Tracking

### Phase 4 — Content Pages (Week 7-8)
- [ ] Blog + post detail
- [ ] Events + detail
- [ ] Success Stories
- [ ] Team
- [ ] Partners
- [ ] FAQ

### Phase 5 — Applications & i18n (Week 9-10)
- [ ] Online Application form
- [ ] IELTS Coaching page
- [ ] TOPIK Coaching page
- [ ] Full i18n for ko, bn, si, vi
- [ ] Privacy Policy & Terms

### Phase 6 — Polish & Launch (Week 11-12)
- [ ] All animations and micro-interactions
- [ ] Performance optimization (Lighthouse 90+)
- [ ] SEO audit and structured data
- [ ] Subdomain testing
- [ ] Mobile/tablet QA
- [ ] Production deployment

---

> **Next**: See **Part 2** for detailed page-by-page content specs.
> **Next**: See **Part 3** for detailed component design specs.
