# 🧩 Part 3 — Components, Design System & Asset Structure

---

## 1. CSS Design System (`app/globals.css`)

```css
:root {
  /* ── Brand Colors ── */
  --brand-gold:        #EFB748;
  --brand-gold-light:  #F1DA7C;
  --brand-gold-hover:  #E6BC32;
  --brand-gold-bg:     #FDF8EC;
  --brand-dark:        #181A19;
  --brand-charcoal:    #3F434C;
  --brand-white:       #FFFFFF;

  /* ── Semantic Colors (Light Theme) ── */
  --color-bg:          #FFFFFF;
  --color-surface:     #F8F9FA;
  --color-surface-2:   #F1F3F5;
  --color-border:      #E8E8E8;
  --color-border-hover:#D1D5DB;
  --color-text:        #181A19;
  --color-text-2:      #3F434C;
  --color-text-muted:  #6B7280;
  --color-accent:      #EFB748;
  --color-accent-hover:#E6BC32;
  --color-success:     #10B981;
  --color-warning:     #F59E0B;
  --color-error:       #EF4444;
  --color-info:        #3B82F6;

  /* ── Typography ── */
  --font-primary:    'Inter', sans-serif;
  --font-display:    'Outfit', sans-serif;
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;
  --text-5xl:  3rem;
  --text-6xl:  3.75rem;

  /* ── Spacing ── */
  --space-1:  0.25rem;  --space-2:  0.5rem;
  --space-3:  0.75rem;  --space-4:  1rem;
  --space-5:  1.25rem;  --space-6:  1.5rem;
  --space-8:  2rem;     --space-10: 2.5rem;
  --space-12: 3rem;     --space-16: 4rem;
  --space-20: 5rem;     --space-24: 6rem;

  /* ── Radius ── */
  --radius-sm:   0.375rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm:  0 1px 2px rgba(0,0,0,0.05);
  --shadow-md:  0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg:  0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl:  0 20px 25px rgba(0,0,0,0.1);
  --shadow-gold:0 4px 14px rgba(239,183,72,0.3);

  /* ── Transitions ── */
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring:cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast:   150ms;
  --duration-normal: 300ms;
  --duration-slow:   500ms;

  /* ── Gradients ── */
  --gradient-gold:    linear-gradient(135deg, #EFB748, #E6BC32);
  --gradient-hero:    linear-gradient(180deg, #FDF8EC 0%, #FFFFFF 100%);
  --gradient-surface: linear-gradient(180deg, #F8F9FA 0%, #FFFFFF 100%);
  --gradient-dark:    linear-gradient(135deg, #181A19 0%, #3F434C 100%);
}
```

---

## 2. Component Specifications

### Header / Navbar

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]  Home  Destinations  Universities  Courses  Services │
│                              [🌐 EN ▾]  [Book Consultation] │
└─────────────────────────────────────────────────────────────┘
```

- **Behavior**: Transparent on hero → solid white with shadow on scroll
- **Logo**: `gt_group_study_abroad_consultancy_name_png.svg`
- **Nav Items**: Home, Destinations (mega dropdown), Universities, Courses, Services, About
- **Right Side**: Language switcher + CTA button (gold)
- **Mobile**: Hamburger → slide-in drawer with staggered links
- **Animation**: `backdrop-filter: blur(12px)` during transition

### Footer

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo]         Quick Links    Destinations   Contact        │
│ GT Group       Home           South Korea    Dhaka Office   │
│ Study Abroad   About          Japan          Seoul Office   │
│ Consultancy    Services       Australia      Colombo Office │
│                Courses        UK             Hanoi Office   │
│ [Social Icons] Blog           Canada                        │
│                Events         USA                           │
│────────────────────────────────────────────────────────────│
│ [Newsletter: Email input + Subscribe]                       │
│────────────────────────────────────────────────────────────│
│ © 2024 GT Group. All rights reserved. | Privacy | Terms    │
└─────────────────────────────────────────────────────────────┘
```

### HeroSection Component

```tsx
<HeroSection
  label="Expert Educational Consulting"
  title="Your Gateway to Global Education"
  subtitle="Expert guidance for 10,000+ students across 4 countries"
  primaryCTA={{ label: "Explore Destinations", href: "/study-destinations" }}
  secondaryCTA={{ label: "Book Free Consultation", href: "/book" }}
  stats={[
    { value: 500, suffix: "+", label: "Universities" },
    { value: 10000, suffix: "+", label: "Students Placed" },
    { value: 15, suffix: "+", label: "Countries" },
    { value: 4, label: "Global Offices" }
  ]}
  backgroundType="globe" // "globe" | "map" | "gradient" | "image"
/>
```

### CountryCard Component

```
┌──────────────────────────┐
│  🇰🇷                      │
│  South Korea             │
│  ────────────             │
│  120+ Universities       │
│  Avg. $8,000/yr          │
│  ────────────             │
│  Popular: Engineering,   │
│  Business, Korean Studies│
│                          │
│  [Explore →]             │
└──────────────────────────┘
```
- Hover: lifts 8px, gold border-top appears, shadow increases
- Animation: staggered grid reveal on scroll

### StatCounter Component

```tsx
<StatCounter value={10000} suffix="+" label="Students Placed" />
```
- Counts from 0 to target value over 2 seconds
- Triggers when scrolled into view (IntersectionObserver)
- Gold color for the number, dark for label

### TestimonialCard Component

```
┌──────────────────────────────────────┐
│  "GT Group made my dream of studying │
│   in Korea a reality. From TOPIK     │
│   coaching to visa processing,       │
│   they handled everything."          │
│                                      │
│  [Photo]  Rahul Sharma               │
│           Seoul National University  │
│           Bangladesh → South Korea   │
│           ★★★★★                      │
└──────────────────────────────────────┘
```

### CourseCard Component

```
┌──────────────────────────┐
│  [📝 Icon]               │
│  IELTS Academic          │
│  ────────────             │
│  Duration: 3 Months      │
│  Schedule: Sun-Thu       │
│  Max Batch: 15 Students  │
│  ────────────             │
│  $299 / course           │
│                          │
│  [Enroll Now]            │
└──────────────────────────┘
```

### Multi-Step Form (Application / Booking)

```
Step Indicator:
[1 ●]───[2 ○]───[3 ○]───[4 ○]───[5 ○]

Each step slides in from right.
Gold progress bar fills across the top.
Validation per step before proceeding.
```

---

## 3. Complete Folder & File Structure

```
apps/study-consultancy/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   ├── not-found.tsx
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── services/
│   │   │   └── page.tsx
│   │   ├── study-destinations/
│   │   │   ├── page.tsx
│   │   │   └── [country]/
│   │   │       └── page.tsx
│   │   ├── universities/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── scholarships/
│   │   │   └── page.tsx
│   │   ├── visa/
│   │   │   ├── page.tsx
│   │   │   └── tracking/
│   │   │       └── page.tsx
│   │   ├── ielts-coaching/
│   │   │   └── page.tsx
│   │   ├── topik-coaching/
│   │   │   └── page.tsx
│   │   ├── blog/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       └── page.tsx
│   │   ├── success-stories/
│   │   │   └── page.tsx
│   │   ├── team/
│   │   │   └── page.tsx
│   │   ├── partners/
│   │   │   └── page.tsx
│   │   ├── faq/
│   │   │   └── page.tsx
│   │   ├── contact/
│   │   │   └── page.tsx
│   │   ├── book/
│   │   │   └── page.tsx
│   │   ├── apply/
│   │   │   └── page.tsx
│   │   ├── privacy-policy/
│   │   │   └── page.tsx
│   │   └── terms/
│   │       └── page.tsx
│   ├── api/
│   │   ├── contact/route.ts
│   │   ├── apply/route.ts
│   │   ├── book/route.ts
│   │   ├── newsletter/route.ts
│   │   └── visa-status/route.ts
│   ├── globals.css
│   └── css-declarations.d.ts
│
├── components/
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── MobileDrawer.tsx
│   │   ├── BreadcrumbNav.tsx
│   │   ├── ScrollProgress.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── sections/
│   │   ├── HeroSection.tsx
│   │   ├── SectionHeader.tsx
│   │   ├── CTABanner.tsx
│   │   ├── NewsletterSignup.tsx
│   │   ├── PartnerLogos.tsx
│   │   └── ProcessTimeline.tsx
│   ├── cards/
│   │   ├── CountryCard.tsx
│   │   ├── UniversityCard.tsx
│   │   ├── CourseCard.tsx
│   │   ├── BlogCard.tsx
│   │   ├── EventCard.tsx
│   │   ├── TeamCard.tsx
│   │   ├── TestimonialCard.tsx
│   │   ├── ScholarshipCard.tsx
│   │   ├── ServiceCard.tsx
│   │   └── OfficeCard.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Badge.tsx
│   │   ├── Tabs.tsx
│   │   ├── Accordion.tsx
│   │   ├── Modal.tsx
│   │   ├── Carousel.tsx
│   │   ├── Pagination.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterSidebar.tsx
│   │   ├── SkeletonLoader.tsx
│   │   ├── StatCounter.tsx
│   │   └── StepIndicator.tsx
│   ├── forms/
│   │   ├── ContactForm.tsx
│   │   ├── ApplicationForm.tsx
│   │   ├── AppointmentForm.tsx
│   │   └── NewsletterForm.tsx
│   ├── animations/
│   │   ├── FadeInUp.tsx
│   │   ├── StaggerChildren.tsx
│   │   ├── ParallaxSection.tsx
│   │   ├── GlobeAnimation.tsx
│   │   └── GoldParticles.tsx
│   └── seo/
│       ├── JsonLd.tsx
│       ├── OpenGraph.tsx
│       └── Breadcrumbs.tsx
│
├── lib/
│   ├── supabase.ts
│   ├── queries/
│   │   ├── destinations.ts
│   │   ├── universities.ts
│   │   ├── courses.ts
│   │   ├── scholarships.ts
│   │   ├── blog.ts
│   │   ├── events.ts
│   │   ├── testimonials.ts
│   │   ├── team.ts
│   │   ├── partners.ts
│   │   ├── faqs.ts
│   │   └── offices.ts
│   ├── utils/
│   │   ├── formatDate.ts
│   │   ├── formatCurrency.ts
│   │   ├── slugify.ts
│   │   └── seo.ts
│   └── constants/
│       ├── countries.ts
│       ├── services.ts
│       └── navigation.ts
│
├── hooks/
│   ├── useScrollAnimation.ts
│   ├── useCountUp.ts
│   ├── useMediaQuery.ts
│   └── useIntersectionObserver.ts
│
├── public/
│   ├── images/
│   │   ├── hero/
│   │   │   ├── gt-study-abroad-hero-students-campus.webp
│   │   │   ├── gt-study-abroad-hero-globe.webp
│   │   │   └── gt-study-abroad-hero-graduation.webp
│   │   ├── destinations/
│   │   │   ├── study-in-south-korea-seoul.webp
│   │   │   ├── study-in-japan-tokyo.webp
│   │   │   ├── study-in-australia-sydney.webp
│   │   │   ├── study-in-uk-london.webp
│   │   │   ├── study-in-canada-toronto.webp
│   │   │   └── study-in-usa-new-york.webp
│   │   ├── courses/
│   │   │   ├── ielts-preparation-course.webp
│   │   │   ├── topik-korean-language-course.webp
│   │   │   └── english-language-training.webp
│   │   ├── team/
│   │   │   └── (team member photos)
│   │   ├── testimonials/
│   │   │   └── (student photos)
│   │   ├── partners/
│   │   │   └── (university logos)
│   │   ├── blog/
│   │   │   └── (blog cover images)
│   │   ├── icons/
│   │   │   ├── gt-favicon-512.png
│   │   │   ├── gt-og-image-1200x630.webp
│   │   │   └── flags/
│   │   │       ├── flag-kr.svg
│   │   │       ├── flag-bd.svg
│   │   │       ├── flag-lk.svg
│   │   │       └── flag-vn.svg
│   │   ├── office/
│   │   │   ├── gt-dhaka-office.webp
│   │   │   ├── gt-seoul-office.webp
│   │   │   ├── gt-colombo-office.webp
│   │   │   └── gt-hanoi-office.webp
│   │   └── services/
│   │       ├── university-placement-service.webp
│   │       ├── visa-processing-service.webp
│   │       └── test-preparation-service.webp
│   ├── lottie/
│   │   ├── globe-animation.json
│   │   ├── success-checkmark.json
│   │   └── loading-dots.json
│   ├── manifest.json
│   └── robots.txt
│
├── messages/
│   ├── en.json
│   ├── ko.json
│   ├── bn.json
│   ├── si.json
│   └── vi.json
│
├── styles/
│   ├── animations.css
│   ├── components.css
│   └── responsive.css
│
├── middleware.ts
├── i18n.ts
├── next.config.js
├── package.json
└── tsconfig.json
```

---

## 4. Dependencies to Add

```json
{
  "dependencies": {
    "framer-motion": "^11.0.0",
    "lottie-react": "^2.4.0",
    "@supabase/supabase-js": "^2.39.0",
    "react-intersection-observer": "^9.8.0",
    "embla-carousel-react": "^8.0.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "date-fns": "^3.3.0",
    "lucide-react": "^0.344.0",
    "sharp": "^0.33.0"
  }
}
```

---

## 5. Subdomain Configuration (`next.config.js`)

```js
module.exports = {
  async rewrites() {
    return [
      // Country subdomains route to locale
      { source: '/:path*', destination: '/bd/:path*', has: [{ type: 'host', value: 'bd.study.gtgroup.com' }] },
      { source: '/:path*', destination: '/kr/:path*', has: [{ type: 'host', value: 'kr.study.gtgroup.com' }] },
      { source: '/:path*', destination: '/lk/:path*', has: [{ type: 'host', value: 'lk.study.gtgroup.com' }] },
      { source: '/:path*', destination: '/vn/:path*', has: [{ type: 'host', value: 'vn.study.gtgroup.com' }] },
    ];
  },
  images: {
    formats: ['image/webp', 'image/avif'],
    domains: ['your-supabase-url.supabase.co'],
  },
};
```

---

## 6. Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse SEO | 100 |
| First Contentful Paint | < 1.5s |
| Largest Contentful Paint | < 2.5s |
| Cumulative Layout Shift | < 0.1 |
| Total Bundle Size | < 200KB (gzipped) |
| Image Format | WebP/AVIF only |
| Font Strategy | `display: swap` |
