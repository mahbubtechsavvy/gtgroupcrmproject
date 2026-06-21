# 🔗 CRM → Website Integration — Part 2
## CRM Website Management Modules & Data Flow

---

## 1. CRM Website Manager — New Modules to Add

The CRM already has `/website` with: news, events, courses, team, testimonials, subscribers.

### New Modules to Add in CRM `/src/app/website/`

```
src/app/website/
├── news/            ✅ EXISTS — Enhance with rich editor
├── events/          ✅ EXISTS — Enhance with registrations view
├── courses/         ✅ EXISTS — Enhance with enrollments view
├── team/            ✅ EXISTS — Enhance with slug, social links
├── testimonials/    ✅ EXISTS — Enhance with photo, video, office filter
├── subscribers/     ✅ EXISTS — Enhance with campaign sender
│
├── destinations/    🆕 NEW — Country/Study Destination manager
│   └── page.jsx
├── universities/    🆕 NEW — University manager
│   └── page.jsx
├── scholarships/    🆕 NEW — Scholarship manager
│   └── page.jsx
├── partners/        🆕 NEW — Partner university logos
│   └── page.jsx
├── faq/             🆕 NEW — FAQ manager (drag to reorder)
│   └── page.jsx
├── appointments/    🆕 NEW — View/manage website bookings
│   └── page.jsx
├── applications/    🆕 NEW — Online application inbox
│   └── page.jsx
├── newsletters/     🆕 NEW — Campaign composer & sender
│   └── page.jsx
├── legal/           🆕 NEW — Privacy Policy & Terms editor
│   └── page.jsx
└── visa/            🆕 NEW — Visa guide content editor
    └── page.jsx
```

---

## 2. Data Flow Per Content Type

### 📝 Blog Posts
```
CRM Staff writes post in /website/news
  → Uploads cover image to Supabase Storage
  → Fills: title, slug (auto), excerpt, content (rich editor),
           category, tags, seo_title, seo_description
  → Toggles: is_published, is_featured
  → Clicks "Publish"
       ↓
  Supabase: news_posts.is_published = true
       ↓
  Website /blog page: Next.js ISR revalidates in 60s
  Website /blog/[slug]: Static page regenerated
       ↓
  Readers see new post live within 60 seconds
```

### 🌍 Destinations (Countries)
```
CRM Staff creates destination in /website/destinations
  → Fills: name, slug, flag image, hero image, description,
           why_study_here, living costs, popular cities/programs,
           visa_overview, requirements (JSONB), seo fields
  → Uploads images to Supabase Storage
  → Toggles: is_published, is_featured
       ↓
  Website /study-destinations: Shows country card
  Website /study-destinations/[country]: Full detail page
       ↓
  SEO: Auto-generated JSON-LD for each destination
```

### 🎓 Universities
```
CRM Staff creates university in /website/universities
  → Links to destination (FK)
  → Fills: name, ranking, logo, cover image, programs,
           tuition range, description, content_html
  → Toggles: is_partner, is_featured, is_published
       ↓
  Website /universities: Explorer grid
  Website /universities/[slug]: Full profile
  Website /study-destinations/[country]: Shows related unis
```

### 📅 Events
```
CRM Staff creates event in /website/events
  → Fills: title, slug, description, date, time, location,
           type (webinar/fair/workshop), cover image,
           is_virtual, capacity, registration_link
  → Toggles: is_published
       ↓
  Website /events: Event calendar/list
  Website /events/[slug]: Detail + registration form
       ↓
  Public fills registration form
       ↓
  Saved to: event_registrations table
       ↓
  CRM: /website/events shows registrants count + list
  Auto-email: Confirmation sent via emailSending.js
```

### 📧 Newsletter Campaign
```
CRM Staff goes to /website/newsletters
  → Clicks "New Campaign"
  → Fills: subject, preview_text, body_html (rich editor)
  → Selects segment: All | By country | By office
  → Previews email in browser
  → Sets schedule or sends immediately
       ↓
  System:
    1. Fetches matching newsletter_subscribers
    2. Batches into groups of 100
    3. Sends via emailSending.js (existing Gmail API)
    4. Logs delivery to newsletter_campaigns.sent_at
    5. Updates open_count via tracking pixel (optional)
       ↓
  Subscribers receive branded HTML email
```

### 👥 Team Members
```
CRM Staff manages in /website/team
  → Fills: name, role, bio, photo (upload), office, email,
           linkedin, whatsapp, sort_order, is_featured
       ↓
  Website /team: Staff grid filtered by office
  Website homepage: Featured team members section
```

### 🏆 Success Stories (Testimonials)
```
Two sources:
  A) Manual: Staff creates in /website/testimonials
     → Fills: student_name, photo, destination, university,
              program, year, quote (content), rating, video_url
     → Toggles: is_featured, is_approved
  
  B) From Student Record:
     → On Student profile in /students, staff adds testimonial
     → Links via student_id FK automatically
       ↓
  Website /success-stories: Testimonial grid + filter
  Website homepage: Carousel of featured testimonials
```

### 🤝 Partners
```
CRM Staff manages in /website/partners
  → Uploads university logo
  → Fills: name, country, website_url, tier, sort_order
       ↓
  Website /partners: Auto-scrolling logo grid
  Website homepage: Partner logo strip section
```

### ❓ FAQ
```
CRM Staff manages in /website/faq
  → Creates Q&A pairs
  → Assigns category: General | Admissions | Visa | Costs | Courses
  → Drag to reorder (sort_order)
       ↓
  Website /faq: Categorized accordion
  Supabase: JSON-LD FAQPage schema auto-generated
```

### 📞 Contact / Office Info
```
CRM Staff edits in /settings (existing) or new /website/offices
  → Updates: address, phone, email, map_embed, working_hours,
             whatsapp, facebook_url, photo_url
       ↓
  Website /contact: Office cards with maps
  Website footer: Office phone + email links
  Country subdomains: Show local office info
```

### 📆 Appointments (Bookings)
```
Website visitor fills /book form
  → Selects office, date, time, topic
  → Fills: name, email, phone
       ↓
  Saved to: web_appointments (status = 'pending')
  Auto-email: Confirmation to visitor + notification to office email
       ↓
  CRM /website/appointments:
    → Staff sees pending list
    → Assigns counselor
    → Updates status: pending → confirmed → completed
    → Can convert to full Student record with one click
```

### 📄 Online Applications
```
Website visitor fills /apply multi-step form
  → Enters personal, education, preferences, scores
  → Uploads documents (optional, to Supabase Storage)
       ↓
  Saved to: web_applications
  Auto-generated: tracking_id (GT-XXXXXXXX)
  Auto-email: Tracking ID + next steps
       ↓
  CRM /website/applications:
    → Application inbox (like email inbox)
    → Filter by office, status, destination
    → Assign counselor
    → Move to pipeline with one click
    → Converts to Student + pipeline card
```

### ⚖️ Privacy Policy & Terms
```
CRM Staff edits in /website/legal
  → Rich HTML editor
  → Sets effective_date, version number
  → Saves
       ↓
  Website /privacy-policy and /terms
  → Fetches latest version from web_legal_pages
  → Shows effective date + version
```

### 🛂 Visa Guide Content
```
CRM Staff manages in /website/visa
  → Per destination: Requirements, documents, timeline,
                     fees, common mistakes
  → Stored as structured HTML in web_destinations.visa_overview
  → Or as separate visa guide linked to destination
       ↓
  Website /visa: Hub with country tabs
  Website /study-destinations/[country]: Visa section
  Website /visa/tracking: Pulls from students table
```

---

## 3. API Routes in Website (`apps/study-consultancy/app/api/`)

```
app/api/
├── public/
│   ├── destinations/route.ts          GET all published destinations
│   ├── destinations/[slug]/route.ts   GET single destination
│   ├── universities/route.ts          GET with filters
│   ├── universities/[slug]/route.ts   GET single university
│   ├── blog/route.ts                  GET published posts
│   ├── blog/[slug]/route.ts           GET + increment view_count
│   ├── events/route.ts                GET upcoming events
│   ├── events/[slug]/route.ts         GET single event
│   ├── courses/route.ts               GET active courses
│   ├── scholarships/route.ts          GET with filters
│   ├── testimonials/route.ts          GET approved + featured
│   ├── team/route.ts                  GET active members
│   ├── partners/route.ts              GET active partners
│   ├── faq/route.ts                   GET by category
│   ├── offices/route.ts               GET published offices
│   └── stats/route.ts                 GET counters (cached 1hr)
│
├── forms/
│   ├── contact/route.ts               POST → web_applications or email
│   ├── apply/route.ts                 POST → web_applications
│   ├── book/route.ts                  POST → web_appointments
│   ├── event-register/route.ts        POST → event_registrations
│   ├── course-enroll/route.ts         POST → course_enrollments
│   └── newsletter/route.ts            POST → newsletter_subscribers
│
└── visa/
    └── status/route.ts                POST → query students table
```

---

## 4. Shared `@gtgroup/api-gateway` Updates

```javascript
// packages/api-gateway/src/

// NEW files to add:
destinations.js     → getDestinations(), getDestinationBySlug()
universities.js     → getUniversities(), getUniversityBySlug()
scholarships.js     → getScholarships()
partners.js         → getPartners()
faqs.js             → getFaqs(category?)
offices.js          → getOffices()
applications.js     → submitApplication(), getApplicationStatus()
appointments.js     → bookAppointment()
campaigns.js        → sendNewsletterCampaign() [CRM only]
legal.js            → getLegalPage(type)

// ENHANCED existing files:
testimonials.js     → add: getByDestination(), getByOffice()
events.js           → add: registerForEvent(), getRegistrations()
courses.js          → add: enrollInCourse(), getEnrollments()
newsletter.js       → add: sendCampaign(), getCampaignStats()
team.js             → add: getByOffice(), getFeatured()
```

---

## 5. CRM → Website: Website Management UI Components

### Shared CMS Components (for all new CRM pages)

```jsx
// src/components/website/
ContentEditor.jsx      // Rich text / HTML editor (TipTap or Quill)
ImageUploader.jsx      // Drag-drop → Supabase Storage upload
SlugGenerator.jsx      // Auto-slug from title, editable
SEOFields.jsx          // seo_title + seo_description with char counters
PublishToggle.jsx       // Draft ↔ Published switch with confirmation
SortableList.jsx       // Drag-to-reorder for FAQ, partners, team
DataTable.jsx          // Reusable table with search + filter + pagination
StatusBadge.jsx        // pending/confirmed/published color badges
FormSubmissionInbox.jsx // Appointment + Application inbox view
NewsletterComposer.jsx  // Email builder with preview
SegmentSelector.jsx     // Target: All | By country | By office
```

---

## 6. Newsletter System Architecture

```
newsletter_subscribers table
  ↓ (filtered by segment)
newsletter_campaigns table
  ↓ (triggers send)
emailSending.js (existing CRM Gmail API)
  ↓ (batched 100/request with delay)
Supabase Edge Function: send_newsletter_batch
  ↓
Each subscriber receives HTML email
  ↓
campaign: sent_at, recipient_count updated
```

### Batch Processing (handles 50,000+ emails)
```javascript
// Supabase Edge Function: send_newsletter_batch
// Called by CRM when campaign is triggered
async function sendNewsletterBatch(campaignId, offset = 0) {
  const BATCH_SIZE = 100;
  const DELAY_MS = 1000; // 1 req/sec = 6000/hr → 50K in ~8hrs

  const subscribers = await getSubscriberBatch(offset, BATCH_SIZE);
  if (subscribers.length === 0) return { done: true };

  for (const sub of subscribers) {
    await sendEmail(sub.email, campaign.subject, campaign.body_html);
    await delay(10); // 100ms between each in batch
  }

  // Schedule next batch
  await scheduleNextBatch(campaignId, offset + BATCH_SIZE);
  return { sent: subscribers.length, nextOffset: offset + BATCH_SIZE };
}
```
