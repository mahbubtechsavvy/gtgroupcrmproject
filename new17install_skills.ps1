# ================================================================
#  new17install_skills.ps1
#  Installs 17 custom CRM/ERP/Mobile/Admin/UI-UX skills globally
#  into:  C:\Users\<You>\.claude\skills\
#
#  Run from ANY directory:
#    powershell -ExecutionPolicy Bypass -File new17install_skills.ps1
#
#  Safe to re-run — skips skills that are already installed.
# ================================================================

$skillsBase = "$env:USERPROFILE\.claude\skills"

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  GT Group Project - Custom Skills Installer (17 Skills)"         -ForegroundColor Cyan
Write-Host "  Target: $skillsBase"                                            -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

# ----------------------------------------------------------------
# Helper: create one skill
# ----------------------------------------------------------------
function Install-Skill {
    param([string]$Name, [string]$Content)

    $dir  = Join-Path $skillsBase $Name
    $file = Join-Path $dir "SKILL.md"

    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    if (Test-Path $file) {
        Write-Host "  [SKIP]    $Name  (already installed)" -ForegroundColor DarkGray
        return
    }

    Set-Content -Path $file -Value $Content -Encoding UTF8
    Write-Host "  [CREATED] $Name" -ForegroundColor Green
}

# ================================================================
#  SKILL 1 — crm-data-modeling
# ================================================================
Install-Skill "crm-data-modeling" @'
---
name: crm-data-modeling
description: Design and implement CRM/ERP database schemas including Contacts, Leads, Accounts, Deals, Pipelines, Activities, Tasks, and custom fields. Use when modeling CRM entities, designing sales pipeline schemas, building customer relationship data structures, or planning CRM database architecture with Supabase/PostgreSQL.
---

# CRM Data Modeling

Expert CRM/ERP schema design for scalable, normalized, multi-tenant relational databases using PostgreSQL/Supabase.

## Core CRM Entities

### 1. Contacts & Accounts
```sql
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT CHECK (size IN ('1-10','11-50','51-200','201-500','500+')),
  annual_revenue NUMERIC,
  country TEXT,
  website TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  account_id UUID REFERENCES accounts(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  job_title TEXT,
  department TEXT,
  lead_source TEXT,
  lifecycle_stage TEXT DEFAULT 'lead',
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Sales Pipeline (Deals)
```sql
CREATE TABLE pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false
);

CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id UUID REFERENCES pipelines(id),
  name TEXT NOT NULL,
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),
  position INTEGER NOT NULL,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false
);

CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage_id UUID REFERENCES pipeline_stages(id),
  contact_id UUID REFERENCES contacts(id),
  account_id UUID REFERENCES accounts(id),
  owner_id UUID REFERENCES users(id),
  expected_close_date DATE,
  won_at TIMESTAMPTZ,
  lost_at TIMESTAMPTZ,
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Activities & Tasks
```sql
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  type TEXT CHECK (type IN ('call','email','meeting','note','task')),
  subject TEXT NOT NULL,
  body TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  account_id UUID REFERENCES accounts(id),
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Custom Fields
```sql
CREATE TABLE custom_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  entity_type TEXT CHECK (entity_type IN ('contact','account','deal','lead')),
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT CHECK (field_type IN ('text','number','date','boolean','select','multi_select')),
  options JSONB,
  is_required BOOLEAN DEFAULT false,
  position INTEGER DEFAULT 0
);
```

## Multi-Tenant RLS
```sql
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON contacts
  USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));
```

## Indexing Strategy
```sql
CREATE INDEX idx_contacts_org_id ON contacts(org_id);
CREATE INDEX idx_contacts_owner ON contacts(owner_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_org_owner ON deals(org_id, owner_id);
```

## Best Practices
- Always use UUID primary keys
- Soft-delete with deleted_at TIMESTAMPTZ instead of hard delete
- Keep org_id on every tenant-scoped table for RLS
- Store currency amounts as NUMERIC with precision
- Use JSONB for flexible metadata
'@

# ================================================================
#  SKILL 2 — erp-module-architect
# ================================================================
Install-Skill "erp-module-architect" @'
---
name: erp-module-architect
description: Design and build ERP modules including HR Management, Payroll, Inventory, Finance/Accounting, Purchase Orders, and Warehouse Management. Use when architecting ERP systems, building business process modules, designing approval workflows, or integrating ERP modules with a CRM system.
---

# ERP Module Architect

Expert ERP system design covering HR, Finance, Inventory, Procurement, and Payroll modules.

## 1. HR Management
```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  employee_code TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  department_id UUID REFERENCES departments(id),
  designation TEXT,
  employment_type TEXT CHECK (employment_type IN ('full_time','part_time','contract','intern')),
  join_date DATE,
  manager_id UUID REFERENCES employees(id),
  salary NUMERIC,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','terminated'))
);

CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES employees(id),
  leave_type TEXT CHECK (leave_type IN ('annual','sick','maternity','paternity','unpaid')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 2. Finance & Accounting
```sql
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  reference TEXT,
  date DATE NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','posted','voided')),
  created_by UUID REFERENCES users(id),
  posted_at TIMESTAMPTZ
);

CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id),
  account_id UUID REFERENCES accounts_coa(id),
  debit NUMERIC DEFAULT 0,
  credit NUMERIC DEFAULT 0
);
```

## 3. Inventory Management
```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'pcs',
  cost_price NUMERIC,
  selling_price NUMERIC,
  reorder_level INTEGER DEFAULT 0
);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  product_id UUID REFERENCES products(id),
  movement_type TEXT CHECK (movement_type IN ('in','out','transfer','adjustment')),
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 4. Approval Workflows
```sql
CREATE TABLE approval_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  module TEXT NOT NULL,
  name TEXT NOT NULL,
  steps JSONB NOT NULL
);

CREATE TABLE approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES approval_workflows(id),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  current_step INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  submitted_by UUID REFERENCES users(id),
  submitted_at TIMESTAMPTZ DEFAULT NOW()
);
```

## ERP-CRM Integration
- Quotes in CRM -> Purchase Orders in ERP
- Contact in CRM -> Customer in Finance
- Deal Won -> Auto-create invoice in Finance
- Inventory check when creating deal line items

## Best Practices
- Separate module schemas (hr, finance, inventory) for isolation
- Use event tables for audit and cross-module integration
- Always implement approval workflows for financial transactions
- Implement fiscal year / accounting period locking
'@

# ================================================================
#  SKILL 3 — multi-tenant-saas-architecture
# ================================================================
Install-Skill "multi-tenant-saas-architecture" @'
---
name: multi-tenant-saas-architecture
description: Design and implement multi-tenant SaaS architecture with tenant isolation, subscription management, onboarding flows, and per-tenant customization. Use when building SaaS platforms, implementing tenant data isolation with Row Level Security (RLS), designing organization/workspace switching, or managing subscription tiers and feature flags per tenant.
---

# Multi-Tenant SaaS Architecture

Production-ready multi-tenancy patterns for SaaS CRM/ERP using PostgreSQL RLS and Supabase.

## Tenant Isolation with RLS
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  max_users INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  trial_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','manager','member','viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

CREATE OR REPLACE FUNCTION get_user_org_id() RETURNS UUID AS $$
  SELECT org_id FROM organization_members WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org_isolation" ON contacts
  FOR ALL USING (org_id = get_user_org_id());
```

## Organization Switching (Next.js)
```typescript
const switchOrg = async (orgId: string) => {
  setCookie('current_org_id', orgId, { maxAge: 30 * 24 * 60 * 60 });
  setCurrentOrg(orgs.find(o => o.id === orgId));
  router.refresh();
};
```

## Feature Flags by Plan
```typescript
const PLAN_FEATURES = {
  free:       { maxUsers: 3,   maxContacts: 100,   analytics: false, api: false },
  starter:    { maxUsers: 10,  maxContacts: 2500,  analytics: true,  api: false },
  pro:        { maxUsers: 50,  maxContacts: 25000, analytics: true,  api: true  },
  enterprise: { maxUsers: -1,  maxContacts: -1,    analytics: true,  api: true  },
};

export function canUseFeature(org: Organization, feature: string): boolean {
  return PLAN_FEATURES[org.plan][feature] !== false;
}
```

## URL-Based Tenancy
```
/app/[orgSlug]/dashboard
/app/[orgSlug]/contacts
/app/[orgSlug]/deals
/app/[orgSlug]/settings
```

## Best Practices
- Never skip org_id filtering; use RLS as defense in depth
- Cache current org in React Context + cookie for SSR
- Implement usage metering per tenant
- Use Stripe Customer per Organization for billing
- Provide 14-day trial with automatic downgrade to free plan
'@

# ================================================================
#  SKILL 4 — admin-panel-design
# ================================================================
Install-Skill "admin-panel-design" @'
---
name: admin-panel-design
description: Design and build feature-rich admin panels with data tables, advanced filters, bulk operations, charts, role-based access control, and audit logs. Use when building back-office admin dashboards, system management interfaces, user management panels, or any admin-facing interface with CRUD operations, pagination, and export features.
---

# Admin Panel Design

Comprehensive patterns for professional, high-performance admin panels for CRM/ERP systems.

## Core Admin Panel Layout
```
Top Bar:  [Logo] [Search] [Notifications] [User Menu]
Sidebar:  Nav items with icons, active state, collapse support
Content:  Breadcrumb + Page Title + Action Buttons
          Filter Bar
          Data Table (sortable, filterable, selectable)
          Pagination
```

## Data Table Features (Must Have)
- Column sorting (client + server-side)
- Global search + per-column filter
- Row selection checkboxes for bulk ops
- Sticky header + horizontal scroll
- Loading skeleton states
- Empty state with CTA
- Export to CSV/Excel
- Pagination with page size selector (10/25/50/100)
- Column visibility toggle
- Row actions menu (edit, delete, view)

## Bulk Operations Pattern
```tsx
const BulkActionBar = ({ selectedIds, onAction }) => (
  <div className="bulk-bar">
    <span>{selectedIds.length} selected</span>
    <Button onClick={() => onAction('export', selectedIds)}>Export</Button>
    <Button onClick={() => onAction('assign', selectedIds)}>Assign Owner</Button>
    <Button onClick={() => onAction('tag', selectedIds)}>Add Tag</Button>
    <Button variant="danger" onClick={() => onAction('delete', selectedIds)}>Delete</Button>
    <Button variant="ghost" onClick={clearSelection}>Cancel</Button>
  </div>
);
```

## Audit Log Schema
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Access Control
```tsx
const PERMISSIONS = {
  admin:   ['users.read','users.write','settings.write','audit.read'],
  manager: ['users.read','contacts.write','reports.read'],
  member:  ['contacts.read','contacts.write'],
  viewer:  ['contacts.read'],
};

const AdminRoute = ({ permission, children }) => {
  const { hasPermission } = usePermissions();
  if (!hasPermission(permission)) return <Forbidden />;
  return children;
};
```

## Performance Tips
- Virtual scrolling for 1000+ rows (react-virtual)
- Debounce search/filter inputs (300ms)
- Optimistic UI updates
- Cache table state in URL params for shareable filtered views
- Lazy load charts and heavy components
'@

# ================================================================
#  SKILL 5 — crm-ux-patterns
# ================================================================
Install-Skill "crm-ux-patterns" @'
---
name: crm-ux-patterns
description: Implement CRM-specific UI/UX patterns including Kanban pipeline boards, contact timeline views, activity feeds, deal cards, lead scoring displays, email threading views, and relationship maps. Use when designing CRM interfaces, building sales pipeline Kanban boards, creating contact detail pages, implementing activity timeline feeds, or designing deal management views.
---

# CRM UX Patterns

Specialized UI/UX patterns for CRM applications — battle-tested from Salesforce, HubSpot, Pipedrive.

## 1. Kanban Pipeline Board
```tsx
const PipelineBoard = () => {
  const { stages, deals } = usePipeline();
  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="pipeline-board flex gap-4 overflow-x-auto">
        {stages.map(stage => (
          <PipelineColumn key={stage.id} stage={stage}>
            {deals.filter(d => d.stage_id === stage.id).map(deal => (
              <DealCard key={deal.id} deal={deal} />
            ))}
          </PipelineColumn>
        ))}
      </div>
    </DndContext>
  );
};
```

## 2. Deal Card Design
- Title + value + close date
- Contact/account avatar + name
- Probability progress bar
- Owner avatar
- Action menu (edit, move, delete)
- Color-coded by age (green=fresh, yellow=aging, red=stale)

## 3. Contact Detail Page Layout
```
Left Panel:          Right Panel (Activity Feed):
- Avatar + Name      - [Log Call] [Email] [Note] [Task]
- Job Title/Company  - Today
- Email / Phone      -   Call logged 15 min
- Account link       -   Email sent: Follow up
- Owner              - Yesterday
- Created date       -   Meeting: Product Demo
- Deals (list)       - Upcoming
- Tags               -   Follow-up call (Tomorrow)
```

## 4. Activity Timeline
- Group activities by date (Today, Yesterday, This Week, etc.)
- Icons per type: Phone=blue, Email=green, Meeting=purple, Note=yellow
- Show relative time (2 hours ago, Yesterday)
- Inline expand for long notes
- Edit/delete on hover

## 5. Global Quick Search (CMD+K)
- Search across contacts, deals, accounts, activities
- Show avatar + name + email for contacts
- Show stage + value for deals
- Recent items shown when empty
- Keyboard navigation (arrows + enter)

## 6. Lead Scoring Widget
- Visual score ring (0-100)
- Color: red=hot (80+), orange=warm (50-79), blue=cold (<50)
- Score breakdown tooltip (email opens, website visits, etc.)

## CRM UX Best Practices
- Speed first: CRM users open 50-100 records/day
- Inline editing: click any field to edit in place
- Keyboard shortcuts: C=new contact, D=new deal, K=command palette
- Contextual actions based on record state
- Real-time notifications for deal changes, task due dates
- Always mobile-responsive for field sales reps
'@

# ================================================================
#  SKILL 6 — supabase-integration
# ================================================================
Install-Skill "supabase-integration" @'
---
name: supabase-integration
description: Implement Supabase features including Auth (email, OAuth, magic link), Realtime subscriptions, Storage, Edge Functions, Row Level Security (RLS), database triggers, and Supabase client setup with Next.js App Router. Use when integrating Supabase into a Next.js project, implementing real-time features, setting up authentication flows, managing file uploads, or writing RLS policies.
---

# Supabase Integration

Complete Supabase integration patterns for Next.js App Router.

## Client Setup
```typescript
// lib/supabase/server.ts — Server Components & Actions
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) { return cookieStore.get(name)?.value; },
        set(name, value, options) { cookieStore.set({ name, value, ...options }); },
        remove(name, options) { cookieStore.set({ name, value: '', ...options }); },
      },
    }
  );
}

// lib/supabase/client.ts — Client Components
import { createBrowserClient } from '@supabase/ssr';
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

## Authentication
```typescript
'use server';
export async function signIn(formData: FormData) {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });
  if (error) redirect('/login?error=' + error.message);
  redirect('/dashboard');
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });
  if (data.url) redirect(data.url);
}
```

## Realtime Subscriptions
```typescript
const channel = supabase
  .channel('contacts-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'contacts',
    filter: `org_id=eq.${orgId}`,
  }, payload => {
    if (payload.eventType === 'INSERT') setContacts(prev => [...prev, payload.new]);
    if (payload.eventType === 'UPDATE') setContacts(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
    if (payload.eventType === 'DELETE') setContacts(prev => prev.filter(c => c.id !== payload.old.id));
  })
  .subscribe();

return () => supabase.removeChannel(channel);
```

## File Storage
```typescript
const { data } = await supabase.storage.from('documents')
  .upload(`${orgId}/${contactId}/${file.name}`, file);

const { data: url } = supabase.storage.from('documents')
  .createSignedUrl(data.path, 3600);
```

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## Best Practices
- Use createServerClient in Server Components, never browser client
- Use auth.getUser() not auth.getSession() for server-side checks
- Enable RLS on every table before production
- Use SUPABASE_SERVICE_ROLE_KEY only in Edge Functions / server actions
'@

# ================================================================
#  SKILL 7 — mobile-crm-react-native
# ================================================================
Install-Skill "mobile-crm-react-native" @'
---
name: mobile-crm-react-native
description: Build mobile CRM/ERP apps with React Native/Expo featuring offline-first sync, push notifications, contact management, deal tracking, barcode scanning, GPS check-ins, and biometric auth. Use when developing mobile CRM apps, implementing offline sync for field sales teams, building mobile-first ERP features, or creating cross-platform iOS/Android CRM applications.
---

# Mobile CRM — React Native/Expo

Production patterns for mobile CRM/ERP apps with offline-first sync.

## Project Setup
```bash
npx create-expo-app --template expo-template-blank-typescript crm-mobile
npx expo install expo-secure-store expo-local-authentication expo-notifications
npx expo install expo-camera expo-barcode-scanner expo-location
npm install @supabase/supabase-js @shopify/flash-list react-native-reanimated
```

## Offline-First Pattern
```typescript
import * as SQLite from 'expo-sqlite';
const db = SQLite.openDatabase('crm_local.db');

class SyncManager {
  async saveContactLocally(contact: Contact) {
    await db.execAsync(
      'INSERT OR REPLACE INTO contacts (id, data, updated_at, synced) VALUES (?, ?, ?, 0)',
      [contact.id, JSON.stringify(contact), Date.now()]
    );
    this.queueForSync('contacts', 'UPSERT', contact);
  }

  async syncToCloud() {
    const pending = await this.getPendingMutations();
    for (const mutation of pending) {
      try {
        await supabase.from(mutation.table).upsert(mutation.data);
        await this.markAsSynced(mutation.id);
      } catch (e) { /* retry next time */ }
    }
  }
}
```

## Push Notifications
```typescript
import * as Notifications from 'expo-notifications';

export async function registerForPushNotifications(userId: string) {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  await supabase.from('push_tokens').upsert({ user_id: userId, token, platform: Platform.OS });
  return token;
}
```

## Biometric Auth
```typescript
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export async function biometricLogin() {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Log in to CRM',
    fallbackLabel: 'Use Password',
  });
  if (result.success) {
    const session = await SecureStore.getItemAsync('user_session');
    await supabase.auth.setSession(JSON.parse(session!));
    return true;
  }
  return false;
}
```

## Mobile Navigation
```typescript
// Bottom tabs for mobile
const TABS = [
  { name: 'home',     icon: HomeIcon,     label: 'Dashboard' },
  { name: 'contacts', icon: UsersIcon,    label: 'Contacts'  },
  { name: 'deals',    icon: TrendingUpIcon, label: 'Deals'   },
  { name: 'tasks',    icon: CheckIcon,    label: 'Tasks'     },
  { name: 'more',     icon: MenuIcon,     label: 'More'      },
];
```

## Performance
```typescript
// Use FlashList for large lists
import { FlashList } from '@shopify/flash-list';
<FlashList data={contacts} estimatedItemSize={72} renderItem={({ item }) => <ContactRow contact={item} />} />
```

## Best Practices
- Always design offline-first — field sales have poor connectivity
- Use expo-secure-store for tokens, never AsyncStorage for sensitive data
- Show sync status: last synced time + pending changes count
- Support deep linking: crm://contacts/uuid for notification taps
- Test on real iOS and Android — don't assume cross-platform parity
'@

# ================================================================
#  SKILL 8 — design-system-creation
# ================================================================
Install-Skill "design-system-creation" @'
---
name: design-system-creation
description: Create and maintain a comprehensive design system with design tokens, component library, typography scale, color palettes, spacing system, icon library, dark/light mode, and documentation. Use when starting a new product design system, establishing brand visual identity, building a component library from scratch, or standardizing UI across web, mobile, and admin panel.
---

# Design System Creation

Build a scalable, consistent design system for CRM/ERP/SaaS products.

## Design Tokens (CSS Custom Properties)
```css
:root {
  /* Brand */
  --color-brand-500: #3b82f6;
  --color-brand-600: #2563eb;

  /* Semantic */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger:  #ef4444;
  --color-info:    #06b6d4;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Type Scale */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;

  /* Spacing (4px base) */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-4:  1rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Border radius */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);

  /* Animation */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --ease-default:    cubic-bezier(0.4, 0, 0.2, 1);
}

[data-theme="dark"] {
  --color-bg:         #0f172a;
  --color-bg-alt:     #1e293b;
  --color-border:     #334155;
  --color-text:       #f1f5f9;
  --color-text-muted: #94a3b8;
}
```

## Component Checklist

### Primitives (build first)
- Button: primary, secondary, ghost, danger; sm/md/lg; loading, disabled
- Input: with label, error, hint, prefix/suffix icon
- Select/Combobox: searchable dropdown
- Checkbox / Radio / Toggle
- Badge: status indicators
- Avatar: initials fallback, online indicator
- Tooltip / Popover

### Layout Components
- Card: header/body/footer
- Modal/Dialog: with focus trap
- Drawer/Sidebar: slide-in panel
- Tabs: keyboard navigation
- Accordion: collapsible sections

### Data Display
- Table/DataGrid: sortable, filterable
- EmptyState: icon + title + description + CTA
- Stat/KPICard: metric with trend
- Chart components (line, bar, donut)
- Timeline: activity feed
- Kanban: drag-and-drop board

## Tailwind Config
```javascript
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: { brand: { 500: '#3b82f6', 600: '#2563eb' } },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
```

## Best Practices
- Design mobile-first, scale up
- Every color must pass WCAG AA contrast ratio (4.5:1)
- Never use font sizes below 12px
- Maintain 8px grid for all spacing
- Document every component in Storybook
- Use Lucide React for icons (consistent set)
'@

# ================================================================
#  SKILL 9 — rbac-permissions-system
# ================================================================
Install-Skill "rbac-permissions-system" @'
---
name: rbac-permissions-system
description: Design and implement Role-Based Access Control (RBAC) with fine-grained permissions, dynamic role assignment, permission guards, middleware protection, and audit trails. Use when building permission systems for CRM/ERP apps, implementing role hierarchies (Owner > Admin > Manager > Member > Viewer), protecting API routes by permission, or rendering UI conditionally based on user roles.
---

# RBAC Permissions System

Production-ready Role-Based Access Control for multi-tenant CRM/ERP.

## Permission Matrix
```typescript
type Role = 'owner' | 'admin' | 'manager' | 'sales_rep' | 'viewer';
type Permission = string; // "resource:action" format

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner:     ['*'],
  admin:     ['contacts:*','accounts:*','deals:*','activities:*','reports:*','users:create','users:read','users:update','settings:*','pipelines:*'],
  manager:   ['contacts:*','accounts:*','deals:*','activities:*','reports:read','reports:export','users:read','pipelines:read'],
  sales_rep: ['contacts:create','contacts:read','contacts:update','accounts:create','accounts:read','deals:create','deals:read','deals:update','activities:*'],
  viewer:    ['contacts:read','accounts:read','deals:read','reports:read'],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  if (perms.includes('*')) return true;
  if (perms.includes(permission)) return true;
  const [resource] = permission.split(':');
  return perms.includes(`${resource}:*`);
}
```

## React Hook
```typescript
export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role as Role ?? 'viewer';
  return {
    can:       (p: Permission) => hasPermission(role, p),
    canAny:    (ps: Permission[]) => ps.some(p => hasPermission(role, p)),
    isAdmin:   ['owner','admin'].includes(role),
    isManager: ['owner','admin','manager'].includes(role),
    role,
  };
}
```

## UI Guard Component
```tsx
export const Can = ({ permission, fallback = null, children }) => {
  const { can } = usePermissions();
  return can(permission) ? <>{children}</> : <>{fallback}</>;
};

// Usage:
<Can permission="contacts:delete">
  <Button variant="danger">Delete</Button>
</Can>
```

## API Route Protection
```typescript
export function withPermission(permission: Permission) {
  return async (req: Request) => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: member } = await supabase
      .from('organization_members').select('role').eq('user_id', user.id).single();

    if (!member || !hasPermission(member.role as Role, permission)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    return null;
  };
}
```

## Database RLS by Role
```sql
CREATE OR REPLACE FUNCTION get_user_role(p_org_id UUID) RETURNS TEXT AS $$
  SELECT role FROM organization_members WHERE user_id = auth.uid() AND org_id = p_org_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE POLICY "contacts_write" ON contacts FOR INSERT
  USING (org_id = get_user_org_id() AND
         get_user_role(org_id) IN ('owner','admin','manager','sales_rep'));

CREATE POLICY "contacts_delete" ON contacts FOR DELETE
  USING (org_id = get_user_org_id() AND
         get_user_role(org_id) IN ('owner','admin'));
```

## Best Practices
- Enforce at BOTH API and database (RLS) levels — never trust client-side only
- Log all permission denials to audit log
- One source of truth: the ROLE_PERMISSIONS matrix
- Show "no permission" messages clearly — don't just hide features silently
'@

# ================================================================
#  SKILL 10 — dashboard-analytics-design
# ================================================================
Install-Skill "dashboard-analytics-design" @'
---
name: dashboard-analytics-design
description: Design and build analytics dashboards with KPI cards, trend charts, sales funnels, revenue analytics, team performance metrics, and real-time data visualization. Use when building CRM/ERP dashboards, implementing chart components with Recharts/Chart.js, designing executive reports, creating sales performance dashboards, or building data visualization layouts with filters and date range pickers.
---

# Dashboard & Analytics Design

Build high-impact analytics dashboards for CRM/ERP with interactive charts.

## Dashboard Layout
```
Top:     [Date Range Picker] [Owner Filter] [Team Filter] [Export]
KPI Row: [Revenue] [Deals Won] [New Leads] [Conversion Rate]
Charts:  Revenue Trend (line) | Pipeline by Stage (funnel)
Bottom:  Team Performance (bar) | Recent Activities (feed)
```

## KPI Card Component
```tsx
interface KPICardProps {
  title:  string;
  value:  string | number;
  trend?: number;       // percentage change
  icon?:  LucideIcon;
  format?: 'currency' | 'number' | 'percent';
}

// Standard CRM KPIs
const CRM_KPIS = [
  { key: 'revenue',     title: 'Total Revenue',   format: 'currency', icon: DollarSign },
  { key: 'deals_won',   title: 'Deals Won',        format: 'number',   icon: TrendingUp },
  { key: 'new_leads',   title: 'New Leads',        format: 'number',   icon: Users      },
  { key: 'conv_rate',   title: 'Conversion Rate',  format: 'percent',  icon: Target     },
  { key: 'avg_deal',    title: 'Avg Deal Value',   format: 'currency', icon: BarChart2  },
  { key: 'sales_cycle', title: 'Avg Sales Cycle',  format: 'number',   icon: Clock      },
];
```

## Charts with Recharts
```tsx
// Revenue Trend (Area Chart)
<AreaChart data={data}>
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.15} />
      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
    </linearGradient>
  </defs>
  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
  <XAxis dataKey="date" tickFormatter={formatAxisDate} />
  <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
  <Tooltip />
  <Area dataKey="revenue" stroke="#3b82f6" fill="url(#grad)" strokeWidth={2} />
</AreaChart>
```

## Date Range Presets
```typescript
const DATE_PRESETS = [
  'Today','Yesterday','Last 7 days','Last 30 days',
  'This month','Last month','This quarter','This year','Custom range'
];
```

## ERP Reports
- Sales Performance: individual & team metrics
- Pipeline Report: deal stages, conversion, forecasting
- Lead Sources: which channels bring best leads
- Win/Loss Analysis: why deals are won or lost
- Revenue Forecast: predicted from pipeline
- Income Statement: P&L by period
- Accounts Receivable: outstanding invoices by aging
- Inventory Valuation: stock value by warehouse

## Chart Best Practices
- Bar = comparison, Line = trend, Pie = composition (max 5 segments), Funnel = conversion
- Always show exact values in tooltips
- Show skeleton loaders for charts, not spinners
- Use ResponsiveContainer from Recharts for all charts
- Add aria-label to all charts for accessibility
- Limit to 90 data points for line charts, 20 for bar charts
'@

# ================================================================
#  SKILL 11 — real-time-features
# ================================================================
Install-Skill "real-time-features" @'
---
name: real-time-features
description: Implement real-time features like live notifications, activity feeds, online presence indicators, collaborative editing, live chat, and instant deal updates using Supabase Realtime, WebSockets, or Server-Sent Events. Use when adding live updates to CRM dashboards, building team presence/collaboration features, implementing real-time notifications, or creating live activity feeds for CRM/ERP apps.
---

# Real-Time Features

Production real-time patterns for CRM/ERP using Supabase Realtime.

## Realtime Table Hook
```typescript
export function useRealtimeTable<T>(table: string, orgId: string,
  onInsert?: (row: T) => void, onUpdate?: (row: T) => void, onDelete?: (row: T) => void
) {
  useEffect(() => {
    const channel = supabase.channel(`${table}:${orgId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter: `org_id=eq.${orgId}` },
        ({ new: row }) => onInsert?.(row as T))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table, filter: `org_id=eq.${orgId}` },
        ({ new: row }) => onUpdate?.(row as T))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table },
        ({ old: row }) => onDelete?.(row as T))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [table, orgId]);
}
```

## Live Notifications
```typescript
useEffect(() => {
  const channel = supabase.channel(`notifications:${userId}`)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      ({ new: notif }) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(c => c + 1);
        toast(notif.title, { description: notif.body });
      })
    .subscribe();
  return () => supabase.removeChannel(channel);
}, [userId]);
```

## Team Presence
```typescript
const channel = supabase.channel(`presence:${orgId}`, {
  config: { presence: { key: user!.id } },
});

channel.on('presence', { event: 'sync' }, () => {
  setOnlineUsers(channel.presenceState());
}).subscribe(async (status) => {
  if (status === 'SUBSCRIBED') {
    await channel.track({
      user_id: user!.id,
      name: user!.full_name,
      current_page: window.location.pathname,
    });
  }
});
```

## Broadcast (No DB Storage)
```typescript
// Send ephemeral events (import progress, typing indicators)
await supabase.channel(`org:${orgId}`).send({
  type: 'broadcast',
  event: 'import_progress',
  payload: { progress: 45, total: 200 },
});
```

## Best Practices
- Unsubscribe channels in useEffect cleanup to prevent memory leaks
- Use Realtime only for live updates; initial data load uses REST
- Add reconnection handling with "Reconnecting..." indicator
- Use broadcast for ephemeral events; postgres_changes for persistent data
- Test with multiple browser tabs to simulate multi-user scenarios
'@

# ================================================================
#  SKILL 12 — saas-email-system
# ================================================================
Install-Skill "saas-email-system" @'
---
name: saas-email-system
description: Build a complete email system for SaaS/CRM including transactional emails, email templates, in-app email composer, email tracking (opens/clicks), thread management, bulk email campaigns, and integration with providers like Resend, SendGrid, or Nodemailer. Use when implementing email features in CRM/ERP, setting up transactional email flows, building email campaign functionality, or tracking email engagement metrics.
---

# SaaS Email System

Complete email infrastructure for CRM/ERP — transactional, tracking, and campaigns.

## Setup with Resend
```typescript
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html, react }) {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to, subject, html, react,
  });
  if (error) throw new Error(`Email failed: ${error.message}`);

  await supabase.from('email_logs').insert({
    provider_id: data?.id,
    to_email: Array.isArray(to) ? to[0] : to,
    subject, status: 'sent', sent_at: new Date().toISOString(),
  });
  return data;
}
```

## Required CRM Email Templates
- welcome: New user welcome + getting started guide
- invite_member: Team invitation with magic link
- deal_won: Congratulations to sales rep + manager
- task_reminder: Upcoming task reminder (24h before)
- lead_assigned: Notification when lead is assigned
- weekly_digest: Weekly summary of pipeline health
- trial_expiring: 3 days before trial ends
- payment_failed: Billing failure with retry link
- password_reset: Password reset link

## Email Tracking (Open Pixel)
```typescript
// Include in HTML email
const trackingPixel = `<img src="${APP_URL}/api/track/open?id=${emailLogId}" width="1" height="1" />`;

// app/api/track/open/route.ts
export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get('id');
  await supabase.from('email_tracking_events').insert({ email_log_id: id, event_type: 'open' });
  return new Response(TRANSPARENT_GIF, { headers: { 'Content-Type': 'image/gif', 'Cache-Control': 'no-cache' } });
}
```

## Unsubscribe (Legal Requirement)
```typescript
// app/api/unsubscribe/route.ts
export async function GET(req: Request) {
  const email = new URL(req.url).searchParams.get('email');
  await supabase.from('email_unsubscribes').insert({ email });
  return redirect('/unsubscribed');
}
```

## Environment
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM="GT Group CRM <noreply@yourapp.com>"
EMAIL_REPLY_TO="support@yourapp.com"
```

## Best Practices
- Always include unsubscribe link in all marketing emails
- Set up SPF, DKIM, DMARC for deliverability
- Test in Gmail, Outlook, Apple Mail (use Litmus)
- Rate limit outbound emails per organization
- Log all sent emails for compliance and debugging
- Use React Email for type-safe, testable email templates
'@

# ================================================================
#  SKILL 13 — nextjs-crm-fullstack
# ================================================================
Install-Skill "nextjs-crm-fullstack" @'
---
name: nextjs-crm-fullstack
description: Build a full-stack CRM/ERP application with Next.js 14+ App Router including Server Components, Server Actions, API routes, optimistic UI, caching strategies, and Supabase integration. Use when architecting a Next.js CRM/ERP app, implementing server-side data fetching patterns, building type-safe API routes, handling form submissions with Server Actions, or setting up Next.js middleware for authentication and tenant routing.
---

# Next.js Full-Stack CRM/ERP Patterns

Production Next.js App Router patterns for CRM/ERP applications.

## Project Structure
```
src/
  app/
    (auth)/login/page.tsx
    (dashboard)/[orgSlug]/
      layout.tsx          - Sidebar + Topbar
      page.tsx            - Dashboard
      contacts/page.tsx   - Contact list (Server Component)
      contacts/[id]/page.tsx
      deals/page.tsx
      settings/page.tsx
    api/contacts/route.ts
    api/webhooks/stripe/route.ts
  components/
    ui/                   - Design system
    crm/                  - CRM components
    admin/                - Admin panel components
    charts/               - Chart components
  lib/
    supabase/server.ts
    supabase/client.ts
    actions/contacts.ts   - Server Actions
    queries/              - DB queries
  hooks/                  - Client hooks
  types/                  - TypeScript types
```

## Server Component Data Fetching
```tsx
// app/(dashboard)/[orgSlug]/contacts/page.tsx
export default async function ContactsPage({ params, searchParams }) {
  const supabase = createClient();
  const { data: org } = await supabase.from('organizations').select('id').eq('slug', params.orgSlug).single();

  let query = supabase.from('contacts').select('*', { count: 'exact' }).eq('org_id', org.id);

  if (searchParams.q) {
    query = query.or(`first_name.ilike.%${searchParams.q}%,email.ilike.%${searchParams.q}%`);
  }

  const page = Number(searchParams.page ?? 1);
  query = query.range((page - 1) * 25, page * 25 - 1);

  const { data: contacts, count } = await query;
  return <ContactsTable contacts={contacts ?? []} total={count ?? 0} />;
}
```

## Server Actions
```typescript
'use server';
export async function createContact(orgId: string, formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const parsed = ContactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors };

  const { data } = await supabase.from('contacts')
    .insert({ ...parsed.data, org_id: orgId, owner_id: user.id })
    .select('id').single();

  revalidatePath('/[orgSlug]/contacts');
  redirect(`/contacts/${data!.id}`);
}
```

## Optimistic UI
```tsx
const [optimisticDeals, updateOptimistic] = useOptimistic(deals,
  (state, { dealId, newStageId }) =>
    state.map(d => d.id === dealId ? { ...d, stage_id: newStageId } : d)
);

const handleDragEnd = async ({ active, over }) => {
  updateOptimistic({ dealId: active.id, newStageId: over.id });
  await updateDealStage(active.id, over.id, orgSlug);
};
```

## Caching Strategy
```typescript
export const revalidate = 60;          // contacts list: 60 sec
export const revalidate = 300;         // dashboard stats: 5 min
export const dynamic = 'force-dynamic'; // deal detail: no cache

// Expensive query cache
const getStats = unstable_cache(
  async (orgId) => supabase.rpc('get_dashboard_stats', { p_org_id: orgId }),
  ['stats'],
  { revalidate: 300, tags: ['dashboard'] }
);
```

## Best Practices
- Prefer Server Components for data fetching
- Use revalidatePath after mutations in Server Actions
- Always validate session + permissions in Server Actions
- Use Suspense + loading.tsx for progressive loading
- Keep Server Actions in lib/actions/, not inline in components
'@

# ================================================================
#  SKILL 14 — ui-ux-responsive-design
# ================================================================
Install-Skill "ui-ux-responsive-design" @'
---
name: ui-ux-responsive-design
description: Implement responsive, mobile-first UI/UX across web, mobile, and admin panel with fluid layouts, adaptive navigation, touch-friendly interactions, and cross-device consistency. Use when designing layouts that must work across desktop, tablet, and mobile, implementing responsive navigation patterns, building touch-friendly interfaces, or ensuring design consistency across all screen sizes.
---

# Responsive UI/UX Design

Mobile-first responsive design patterns for CRM/ERP/SaaS across all devices.

## Breakpoint System
```
xs  = 0px    - Small phones (base)
sm  = 640px  - Large phones / small tablets
md  = 768px  - Tablets
lg  = 1024px - Small laptops
xl  = 1280px - Desktops
2xl = 1536px - Large monitors
```

## Adaptive Navigation
```tsx
const Navigation = () => {
  const { isMobile, isTablet } = useBreakpoint();
  if (isMobile) return <BottomTabNav />;       // 5 tabs at bottom
  return <Sidebar collapsible={isTablet} />;   // collapsible sidebar
};

// Mobile: fixed bottom tab bar with safe area
// Tablet: hamburger-triggered sidebar
// Desktop: persistent sidebar (collapsible to icon-only)
```

## Responsive Tables (Mobile = Card List)
```tsx
const ResponsiveTable = ({ contacts }) => {
  const { isMobile } = useBreakpoint();
  if (isMobile) {
    return (
      <div className="space-y-3">
        {contacts.map(c => (
          <div className="card p-4 flex items-center gap-3">
            <Avatar contact={c} />
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.first_name} {c.last_name}</p>
              <p className="text-sm text-gray-500 truncate">{c.email}</p>
            </div>
            <ChevronRight className="text-gray-400" />
          </div>
        ))}
      </div>
    );
  }
  return <FullDataTable contacts={contacts} />;
};
```

## Touch-Friendly Rules
```css
/* Minimum touch target: 44x44px (Apple HIG) */
.touch-target { min-height: 44px; min-width: 44px; }

/* Show actions always on touch (not hover-only) */
@media (hover: none) { .hover-action { display: flex; } }
@media (hover: hover) {
  .hover-action { display: none; }
  tr:hover .hover-action { display: flex; }
}
```

## Mobile Form Inputs
```tsx
<Input label="Email"  type="email" inputMode="email" autoComplete="email" autoCapitalize="none" />
<Input label="Phone"  type="tel"   inputMode="tel"   autoComplete="tel" />
<Input label="Number" type="number" inputMode="decimal" />
```

## Safe Areas (iPhone)
```css
.page-container { padding-bottom: calc(16px + env(safe-area-inset-bottom)); }
.bottom-nav     { padding-bottom: env(safe-area-inset-bottom); }
.full-height    { height: 100dvh; } /* dynamic viewport height */
```

## Mobile Testing Checklist
- Touch targets >= 44x44px on all interactive elements
- Form inputs trigger correct keyboard types
- No horizontal scroll on any screen size
- Pull-to-refresh on all list screens
- Landscape orientation works correctly
- Tested with system font size set to Large
- Low-network conditions (3G) tested
- Tested on real iPhone (Safari) + Android (Chrome)
'@

# ================================================================
#  SKILL 15 — crm-workflow-automation
# ================================================================
Install-Skill "crm-workflow-automation" @'
---
name: crm-workflow-automation
description: Build workflow automation for CRM/ERP including trigger-based automations, lead assignment rules, deal stage transition actions, automated follow-up sequences, approval workflows, and notification routing. Use when implementing CRM automation rules, building no-code workflow builders, automating lead nurturing sequences, or creating trigger-action automation systems similar to HubSpot Workflows or Zapier.
---

# CRM Workflow Automation

Trigger-action automation for CRM/ERP.

## Data Model
```sql
CREATE TABLE automation_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL,
  trigger_conditions JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE automation_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES automation_workflows(id),
  trigger_entity_type TEXT,
  trigger_entity_id UUID,
  status TEXT DEFAULT 'running',
  actions_executed JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

## Trigger Types
- contact_created, contact_updated, contact_tag_added
- deal_created, deal_stage_changed, deal_won, deal_lost
- deal_close_date_approaching (X days before)
- task_created, task_overdue, task_completed
- contact_idle (no activity for X days)
- deal_stuck_in_stage (same stage for X days)

## Action Types
- update_contact / update_deal: change a field value
- add_tag / remove_tag
- assign_owner: specific user / round-robin / least busy
- send_email: using template
- send_notification: in-app notification
- create_task: with due date and assignee
- move_deal_stage: move to specific stage
- send_webhook: POST to external URL
- wait: delay X minutes/hours between actions
- if_branch: conditional branching

## Automation Engine
```typescript
export class AutomationEngine {
  async trigger(triggerType: string, entityId: string, context: Record<string, unknown>) {
    const { data: workflows } = await supabaseAdmin
      .from('automation_workflows')
      .select('*').eq('trigger_type', triggerType).eq('is_active', true).eq('org_id', context.org_id);

    for (const workflow of workflows ?? []) {
      if (!this.matchesConditions(workflow.trigger_conditions, context)) continue;
      // Execute actions asynchronously
      this.executeActions(workflow.actions, context).catch(console.error);
    }
  }
}
```

## Round-Robin Lead Assignment
```typescript
export async function assignLeadRoundRobin(orgId: string, teamId: string) {
  const { data: members } = await supabase
    .from('organization_members')
    .select('user_id, assignment_count')
    .eq('org_id', orgId).eq('team_id', teamId).eq('is_active', true)
    .order('assignment_count', { ascending: true });

  const assignee = members?.[0];
  await supabase.from('organization_members')
    .update({ assignment_count: assignee.assignment_count + 1 })
    .eq('user_id', assignee.user_id);

  return assignee.user_id;
}
```

## Best Practices
- Execute automations asynchronously — never block user's action
- Implement deduplication — don't fire the same automation twice
- Rate limit per workflow to prevent runaway loops
- Log every execution — users will ask why automation fired
- Allow users to test automations before activating
- Provide opt-out mechanisms for email sequences
'@

# ================================================================
#  SKILL 16 — saas-billing-subscription
# ================================================================
Install-Skill "saas-billing-subscription" @'
---
name: saas-billing-subscription
description: Implement SaaS subscription billing with Stripe including plan management, trial periods, usage-based billing, invoice generation, payment failure handling (dunning), and customer portal. Use when building subscription-based pricing for CRM/ERP SaaS, implementing Stripe Billing, handling webhook events for subscription lifecycle, creating billing dashboards, or managing free trial to paid conversion flows.
---

# SaaS Billing & Subscription

Production Stripe billing for SaaS CRM/ERP.

## Plans
```typescript
export const PLANS = {
  FREE:       { priceId: null,                             monthlyPrice: 0,   features: { maxUsers: 3,   maxContacts: 100   } },
  STARTER:    { priceId: process.env.STRIPE_STARTER_PRICE_ID!, monthlyPrice: 29,  features: { maxUsers: 10,  maxContacts: 2500  } },
  PRO:        { priceId: process.env.STRIPE_PRO_PRICE_ID!,    monthlyPrice: 79,  features: { maxUsers: 50,  maxContacts: 25000 } },
  ENTERPRISE: { priceId: process.env.STRIPE_ENT_PRICE_ID!,    monthlyPrice: 299, features: { maxUsers: -1,  maxContacts: -1    } },
};
```

## Checkout Session
```typescript
'use server';
export async function createCheckoutSession(orgId: string, priceId: string) {
  const session = await stripe.checkout.sessions.create({
    customer: org.stripe_customer_id,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    allow_promotion_codes: true,
    subscription_data: {
      trial_period_days: 14,
      metadata: { org_id: orgId },
    },
    success_url: `${APP_URL}/${orgSlug}/settings/billing?success=true`,
    cancel_url:  `${APP_URL}/${orgSlug}/settings/billing`,
  });
  redirect(session.url!);
}
```

## Webhook Handler
```typescript
export async function POST(req: Request) {
  const event = stripe.webhooks.constructEvent(
    await req.text(),
    req.headers.get('stripe-signature')!,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  switch (event.type) {
    case 'customer.subscription.updated':
      await supabase.from('organizations').update({
        plan: getPlanFromPriceId(sub.items.data[0].price.id),
        subscription_status: sub.status,
        trial_ends_at: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      }).eq('id', sub.metadata.org_id);
      break;

    case 'customer.subscription.deleted':
      await supabase.from('organizations').update({ plan: 'free', subscription_status: 'canceled' })
        .eq('id', sub.metadata.org_id);
      break;

    case 'invoice.payment_failed':
      await sendPaymentFailedEmail(invoice.customer_email!, invoice.hosted_invoice_url!);
      break;
  }
  return new Response('OK');
}
```

## Dunning Sequence
```
Day 0: Payment failed email + Update payment method CTA
Day 3: Reminder email
Day 7: Account suspension warning (24h notice)
Day 8: Downgrade to free plan
```

## Environment
```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_STARTER_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_ENT_PRICE_ID=price_...
```

## Best Practices
- Always use Stripe Checkout — never build custom payment forms (PCI compliance)
- Test webhooks: stripe listen --forward-to localhost:3000/api/webhooks/stripe
- Store stripe_customer_id on org — never look up by email
- Handle webhook idempotency — Stripe may send same event multiple times
- Send trial expiry emails at 7 days, 3 days, and 1 day before expiry
'@

# ================================================================
#  SKILL 17 — gt-project-coordinator
# ================================================================
Install-Skill "gt-project-coordinator" @'
---
name: gt-project-coordinator
description: Coordinate development across the GT Group CRM/ERP project including the Next.js CRM web app, corporate website, React Native mobile app, and admin panel. Use when planning sprint tasks, coordinating cross-platform features, managing shared API contracts between web and mobile, tracking project milestones, or making architecture decisions that affect multiple parts of the GT Group project.
---

# GT Group Project Coordinator

Project-specific coordination for the GT Group CRM/ERP full-stack platform.

## Project Surfaces
| Surface        | Tech Stack                          | Purpose                      |
|----------------|-------------------------------------|------------------------------|
| CRM Web App    | Next.js 14, Supabase, Tailwind      | Main CRM/ERP application     |
| Corporate Site | Next.js, Tailwind                   | Marketing & landing pages    |
| Mobile App     | React Native + Expo                 | Field sales & mobile CRM     |
| Admin Panel    | Next.js (separate route group)      | Super-admin management       |

## Tech Stack
```
Backend:   Supabase (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
Frontend:  Next.js 14 App Router + TypeScript + Tailwind CSS
Mobile:    React Native + Expo + EAS
Email:     Resend
Payments:  Stripe
Hosting:   Vercel (web + admin) + EAS (mobile)
State:     React Query + Zustand (client) + React Server Components (server)
Forms:     React Hook Form + Zod
Charts:    Recharts
Icons:     Lucide React
```

## Core Database Tables
- organizations, organization_members (multi-tenant root)
- contacts, accounts, deals, activities (CRM entities)
- pipelines, pipeline_stages (sales pipeline)
- notifications, push_tokens (cross-platform notifications)
- employees, departments, leave_requests (ERP HR)
- products, inventory_movements (ERP inventory)

## Cross-Platform Feature Checklist
When adding any new CRM feature, verify all surfaces:
- Web App: Server Component + Client Component + Server Action
- Mobile: New screen + offline sync + push notification
- Admin Panel: Management interface + audit log view
- Backend: Supabase RLS policy + Edge Function if needed
- Types: Update shared TypeScript types
- Tests: Unit tests + E2E for critical paths

## Sprint Planning Template
```markdown
## Sprint N — [Date Range]
### CRM Web App
- [ ] Feature: [name]

### Mobile App
- [ ] Feature: [name]

### Admin Panel
- [ ] Feature: [name]

### Infrastructure
- [ ] DB migration: [description]
- [ ] Edge Function: [description]
```

## Key Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

## Common Commands
```bash
npm run dev                    # Start Next.js dev server
supabase start                 # Start local Supabase
npx expo start                 # Start Expo dev server
supabase migration new [name]  # Create DB migration
supabase db push               # Push migrations to production
eas build --platform all       # Build mobile apps
```

## Deployment Checklist
- npm run build — no TypeScript errors
- Test auth flow (login, signup, Google OAuth)
- Test as each role (owner, admin, manager, viewer)
- Verify RLS data isolation between orgs
- Mobile app builds (iOS + Android)
- Stripe webhooks working (check Stripe dashboard)
- Email delivery working (check Resend dashboard)
- Lighthouse score > 85
'@

# ================================================================
#  Final Summary
# ================================================================
Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  COMPLETE!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan

$total = (Get-ChildItem "$env:USERPROFILE\.claude\skills" -Directory -ErrorAction SilentlyContinue).Count
Write-Host ""
Write-Host "  New skills location: $skillsBase" -ForegroundColor White
Write-Host "  Total skills now:    $total" -ForegroundColor Green
Write-Host ""
Write-Host "  The 17 custom skills cover:" -ForegroundColor White
Write-Host "   CRM/ERP  : crm-data-modeling, erp-module-architect, crm-workflow-automation" -ForegroundColor Yellow
Write-Host "   SaaS     : multi-tenant-saas-architecture, saas-billing-subscription, saas-email-system" -ForegroundColor Yellow
Write-Host "   Next.js  : nextjs-crm-fullstack, supabase-integration, real-time-features" -ForegroundColor Yellow
Write-Host "   Mobile   : mobile-crm-react-native" -ForegroundColor Yellow
Write-Host "   Admin    : admin-panel-design, rbac-permissions-system" -ForegroundColor Yellow
Write-Host "   UI/UX    : design-system-creation, crm-ux-patterns, dashboard-analytics-design, ui-ux-responsive-design" -ForegroundColor Yellow
Write-Host "   Project  : gt-project-coordinator" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Restart Claude Code to load the new skills." -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
