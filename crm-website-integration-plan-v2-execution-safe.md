# CRM ↔ Website Integration Plan V2 (Execution-Safe)

Status: Ready for implementation after adopting this corrected sequence and policy set.

## 1) Corrected Migration Sequence (mapped to current repo)

Your repo already contains migrations up to `036_currency_rates.sql`, and also has duplicate `031_*` historical files.  
To avoid ordering conflicts, use **new forward-only numbers**:

- `037_website_cms_schema_hardening.sql`
  - Create/alter website CMS tables.
  - Add status checks, uniqueness constraints, and indexes.
  - Add `updated_at` trigger function + triggers.
- `038_website_rls_policies.sql`
  - Enable RLS and create full policy matrix.
  - Add role+office scoping rules.
- `039_website_publication_and_search.sql`
  - Realtime publication updates with idempotent `DO $$`.
  - FTS (`tsvector`) generated columns and GIN indexes.
- `040_website_public_form_guardrails.sql`
  - Anti-spam/rate-limit tables and functions.
  - Optional captcha verification hooks.

Do not reuse `030/031/032` labels from external plan docs.

## 2) Full RLS Matrix (authoritative)

Use this model for all new website tables:

- Public content tables (`web_destinations`, `web_universities`, `web_scholarships`, `web_partners`, `web_faqs`, `web_legal_pages`, plus published rows in `news_posts`, `events`, `website_courses`, `team_members`, `testimonials`)
  - Public (`anon`): `SELECT` only where published/active/approved condition is true.
  - CRM authenticated:
    - `ceo`, `coo`, `it_manager`: all offices.
    - office staff (`counselor`, office manager roles): own office rows where applicable.
- Form intake tables (`web_applications`, `web_appointments`, `event_registrations`, `course_enrollments`)
  - `anon`: `INSERT` only through constrained checks.
  - CRM authenticated: read/update by office scope; super roles full access.
- Campaign/admin tables (`newsletter_campaigns`)
  - No `anon` access.
  - CRM authenticated by privileged roles only.

Required helper functions (security definer, stable):
- `public.current_user_role()`
- `public.current_user_office_id()`
- `public.is_super_role()`

Example reusable policy shape:

```sql
ALTER TABLE public.web_destinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY web_destinations_public_read
ON public.web_destinations
FOR SELECT
TO anon, authenticated
USING (is_published = true);

CREATE POLICY web_destinations_crm_write
ON public.web_destinations
FOR ALL
TO authenticated
USING (public.current_user_role() IN ('ceo','coo','it_manager','content_manager'))
WITH CHECK (public.current_user_role() IN ('ceo','coo','it_manager','content_manager'));
```

## 3) Anti-Spam + Abuse Controls (public forms)

Do not keep `WITH CHECK (true)` alone.

Minimum controls:
- Add submission metadata columns:
  - `ip_hash text`, `user_agent text`, `submitted_at timestamptz default now()`
- Add dedupe constraints:
  - `event_registrations`: unique `(event_id, email)`
  - `course_enrollments`: unique `(course_id, email)`
- Add per-window throttling function:
  - max N submissions per `ip_hash` per 15 minutes
- Reject known disposable domains (optional list table).
- Enforce minimal field validation in DB check constraints.
- Add captcha token field + server-side verification (website API route), then write to DB.

Example rate-limit guard:

```sql
CREATE OR REPLACE FUNCTION public.allow_form_submit(p_ip_hash text, p_window_minutes int, p_limit int)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) < p_limit
  FROM public.web_form_submissions_log
  WHERE ip_hash = p_ip_hash
    AND created_at > now() - make_interval(mins => p_window_minutes);
$$;
```

## 4) Idempotent SQL Patterns (must use)

### 4.1 Realtime publication (safe reruns)

```sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_destinations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_destinations;
  END IF;
END $$;
```

Repeat this block per table instead of raw `ALTER PUBLICATION ... ADD TABLE`.

### 4.2 Constraints/indexes

- `CREATE INDEX IF NOT EXISTS ...`
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...`
- For unique constraints:
  - create unique index with `IF NOT EXISTS`, then attach constraint if needed.

### 4.3 Status data integrity

Prefer enums or strict checks:

```sql
ALTER TABLE public.web_appointments
  ADD CONSTRAINT web_appointments_status_check
  CHECK (status IN ('pending','confirmed','completed','cancelled'));
```

### 4.4 Automatic `updated_at`

Use trigger-based updates across all mutable CMS tables:

```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

Attach with `DROP TRIGGER IF EXISTS ...; CREATE TRIGGER ... BEFORE UPDATE`.

## 5) API + RLS Alignment Rules

- Public website routes that mutate (e.g., blog view count increments) must use:
  - server route + service role key, or
  - dedicated RPC with controlled permission.
- Never rely on anon client updates for counters.
- Keep public read route caching (ISR) independent from write paths.

## 6) Execution Order (practical)

1. Apply `037` schema hardening.
2. Apply `038` RLS and helper functions.
3. Apply `039` publication + FTS.
4. Apply `040` anti-spam guardrails.
5. Run smoke tests:
   - anon read published content succeeds.
   - anon cannot read drafts/private rows.
   - anon inserts pass only within limits.
   - office user sees own-office intake rows.
   - super roles see all rows.
6. Only then implement CRM/website UI modules.

## 7) Required Pre-Implementation Decisions

Lock these now to avoid rework:
- Canonical visa content model:
  - Option A: `web_destinations.visa_overview` only.
  - Option B: dedicated `web_visa_guides` table (recommended for scale/versioning).
- Role list finalization for content write access.
- Whether newsletter send queue runs via Supabase Edge Function only or hybrid with existing Gmail module.

---

If you follow this V2 file, the original plan becomes safe to execute in production-like environments.
