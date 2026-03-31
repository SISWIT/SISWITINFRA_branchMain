# Super Admin (Platform Super Admin) - Architectural Plan
### Author: Sunny
## Executive Summary

This document outlines the comprehensive architectural plan for the **Platform Super Admin** page in the SISWIT SaaS platform. The super admin is the highest-level role in the system, representing the SaaS company owner who manages the entire platform, all tenant organizations, users, billing, and system-wide configurations.

---

## 1. Role Definition & Permissions

### 1.1 Role Hierarchy

```
platform_super_admin (Level 100) ──── SaaS Company Owner
    │
    ├── owner (Level 80) ──── Organization Owner
    │   ├── admin (Level 70) ──── Organization Admin
    │   │   ├── manager (Level 60) ──── Manager
    │   │   │   └── employee (Level 50) ──── Employee
    │   │   └── client (Level 20) ──── Client
```

### 1.2 Super Admin Permissions Matrix

| Permission Category | Permission | Description |
|-------------------|------------|-------------|
| **Organization Management** | View all organizations | Read-only access to all tenant organizations |
| | Create organization | Create new tenant organizations |
| | Edit organization | Modify organization details, settings, branding |
| | Suspend organization | Temporarily disable organization access |
| | Cancel organization | Permanently disable organization |
| | Delete organization | Remove organization and all data (soft-delete) |
| | Impersonate organization | Access any organization as owner/admin |
| **User Management** | View all users | Read-only access to all platform users |
| | Create user | Create users in any organization |
| | Edit user | Modify user details, roles, permissions |
| | Suspend user | Temporarily disable user access |
| | Delete user | Remove user from platform |
| | Impersonate user | Access platform as any user |
| **Billing & Subscriptions** | View all subscriptions | Read-only access to all billing data |
| | Create subscription | Create new subscriptions for organizations |
| | Modify subscription | Change plan types, module access, limits |
| | Suspend subscription | Temporarily disable subscription |
| | Cancel subscription | Cancel organization subscription |
| | Process refunds | Issue refunds for billing transactions |
| **Platform Configuration** | View platform settings | Read-only access to global settings |
| | Modify platform settings | Update global configurations |
| | Manage feature flags | Enable/disable platform-wide features |
| | Configure plan limits | Set resource limits for each plan tier |
| | Manage modules | Enable/disable modules globally |
| **Audit & Security** | View all audit logs | Read-only access to all platform events |
| | Export audit logs | Download audit log data |
| | View security events | Monitor security-related activities |
| | Manage platform admins | Add/remove other platform admins |
| **System Operations** | View system health | Monitor platform performance metrics |
| | Manage background jobs | View and control async job processing |
| | Database operations | Access to database management tools |
| | API management | Monitor and manage API usage |

### 1.3 Permission Enforcement

```typescript
// Permission check pattern
const isPlatformAdmin = isPlatformRole(userRole);

// Platform admin bypasses all tenant-level checks
if (isPlatformAdmin) {
  // Full access to all resources
  return true;
}

// Tenant-level permission checks
const canAccess = hasRequiredRole && hasRequiredModule;
```

---

## 2. Page Structure & Navigation

### 2.1 Main Navigation Items

```
/platform
├── /platform (Dashboard Overview)
├── /platform/organizations (Organization Management)
├── /platform/users (User Management)
├── /platform/subscriptions (Billing & Subscriptions)
├── /platform/modules (Module Management)
├── /platform/plans (Plan Configuration)
├── /platform/audit-logs (Audit Logs)
├── /platform/security (Security & Access)
├── /platform/system (System Health & Operations)
├── /platform/settings (Platform Settings)
└── /platform/analytics (Platform Analytics)
```

### 2.2 Sidebar Navigation Structure

```typescript
const menuItems = [
  { title: "Overview", icon: LayoutDashboard, path: platformPath() },
  { title: "Organizations", icon: Building2, path: platformPath("organizations") },
  { title: "Users", icon: Users, path: platformPath("users") },
  { title: "Subscriptions", icon: CreditCard, path: platformPath("subscriptions") },
  { title: "Modules", icon: Package, path: platformPath("modules") },
  { title: "Plans", icon: Layers, path: platformPath("plans") },
  { title: "Audit Logs", icon: FileText, path: platformPath("audit-logs") },
  { title: "Security", icon: Shield, path: platformPath("security") },
  { title: "System", icon: Server, path: platformPath("system") },
  { title: "Analytics", icon: BarChart3, path: platformPath("analytics") },
  { title: "Settings", icon: Settings, path: platformPath("settings") },
];
```

---

## 3. Dashboard Overview Page

### 3.1 Key Metrics Cards

| Metric | Description | Data Source |
|--------|-------------|-------------|
| **Total Organizations** | Count of all tenant organizations | `organizations` table |
| **Active Organizations** | Count of organizations with status = 'active' | `organizations` table |
| **Trial Organizations** | Count of organizations with status = 'trial' | `organizations` table |
| **Total Users** | Count of all platform users | `profiles` table |
| **Active Users** | Count of users with active sessions | `organization_memberships` table |
| **MRR (Monthly Recurring Revenue)** | Sum of active subscription values | `organization_subscriptions` table |
| **ARR (Annual Recurring Revenue)** | MRR × 12 | Calculated |
| **Churn Rate** | Percentage of cancelled subscriptions | Calculated |
| **Average Revenue Per User** | MRR / Active Users | Calculated |
| **Storage Usage** | Total storage consumed across platform | `storage_usage` table |
| **API Calls** | Total API calls in current period | `api_usage` table |
| **E-Signatures** | Total e-signatures processed | `contract_esignatures` table |

### 3.2 Charts & Visualizations

1. **Revenue Trend Chart** (Line Chart)
   - X-axis: Months (last 12 months)
   - Y-axis: Revenue ($)
   - Shows MRR growth over time

2. **Organization Growth Chart** (Bar Chart)
   - X-axis: Months (last 12 months)
   - Y-axis: Organization count
   - Shows new organizations created per month

3. **Plan Distribution Chart** (Pie/Donut Chart)
   - Segments: Starter, Professional, Enterprise
   - Shows distribution of organizations across plan tiers

4. **Module Adoption Chart** (Stacked Bar Chart)
   - X-axis: Modules (CRM, CPQ, CLM, ERP, Documents)
   - Y-axis: Organization count
   - Shows which modules are most popular

5. **User Activity Heatmap** (Heatmap)
   - X-axis: Hours of day (0-23)
   - Y-axis: Days of week (Mon-Sun)
   - Shows peak usage times

### 3.3 Quick Actions Panel

- **Create New Organization** → Opens organization creation modal
- **View Recent Signups** → Shows last 10 organization signups
- **Check System Health** → Opens system health dashboard
- **Review Pending Approvals** → Shows organizations/users awaiting approval
- **Export Platform Report** → Generates comprehensive platform report

### 3.4 Recent Activity Feed

- New organization signups
- Subscription upgrades/downgrades
- User registrations
- Payment events
- System alerts

---

## 4. Organization Management Page

### 4.1 Organization Directory

**Features:**
- Searchable table with filters
- Sortable columns (name, status, plan, users, created date)
- Bulk actions (suspend, activate, export)
- Quick view cards for each organization

**Columns:**
| Column | Description |
|--------|-------------|
| Organization Name | Company name with logo |
| Slug | URL-friendly identifier |
| Status | Active, Trial, Suspended, Cancelled |
| Plan | Starter, Professional, Enterprise |
| Users | Active user count |
| Created | Organization creation date |
| Last Active | Last activity timestamp |
| Actions | View, Edit, Impersonate, Suspend, Delete |

### 4.2 Organization Detail View

**Tabs:**
1. **Overview**
   - Organization details (name, slug, code, status)
   - Company information (email, phone, address, website)
   - Branding (logo, colors)
   - Owner information
   - Subscription summary

2. **Users**
   - List of all organization members
   - Role distribution
   - User activity metrics
   - Invitation management

3. **Subscription**
   - Current plan details
   - Module access
   - Resource limits and usage
   - Billing information
   - Payment history

4. **Activity**
   - Organization-specific audit logs
   - User login history
   - Feature usage statistics

5. **Settings**
   - Organization-specific configurations
   - Feature flags
   - Custom branding options

### 4.3 Organization Actions

| Action | Description | Confirmation Required |
|--------|-------------|----------------------|
| **View** | Open organization detail page | No |
| **Edit** | Modify organization details | Yes |
| **Impersonate** | Access organization as owner | Yes (with audit log) |
| **Suspend** | Temporarily disable organization | Yes |
| **Activate** | Re-enable suspended organization | No |
| **Cancel** | Permanently disable organization | Yes |
| **Delete** | Soft-delete organization | Yes (double confirmation) |
| **Export** | Download organization data | No |

---

## 5. User Management Page

### 5.1 User Directory

**Features:**
- Global user search across all organizations
- Filters by role, status, organization
- Bulk actions (suspend, activate, export)

**Columns:**
| Column | Description |
|--------|-------------|
| User | Email and full name |
| Organization | Organization name |
| Role | Platform role (owner, admin, manager, employee, client) |
| Status | Active, Inactive, Suspended |
| Account State | Pending Verification, Pending Approval, Active, Rejected |
| Last Login | Last login timestamp |
| Created | Account creation date |
| Actions | View, Edit, Impersonate, Suspend, Delete |

### 5.2 User Detail View

**Information Displayed:**
- Personal information (name, email, phone, avatar)
- Organization membership details
- Role and permissions
- Account state and verification status
- Login history and activity
- Invitation history (if applicable)

### 5.3 User Actions

| Action | Description | Confirmation Required |
|--------|-------------|----------------------|
| **View** | Open user detail page | No |
| **Edit** | Modify user details | Yes |
| **Change Role** | Update user role | Yes |
| **Impersonate** | Access platform as user | Yes (with audit log) |
| **Suspend** | Temporarily disable user | Yes |
| **Activate** | Re-enable suspended user | No |
| **Delete** | Remove user from platform | Yes (double confirmation) |
| **Reset Password** | Force password reset | Yes |
| **Verify Email** | Manually verify email | No |

---

## 6. Subscriptions & Billing Page

### 6.1 Subscription Matrix

**Features:**
- Overview of all organization subscriptions
- Plan distribution visualization
- Revenue breakdown by plan type
- Module adoption statistics

**Columns:**
| Column | Description |
|--------|-------------|
| Organization | Organization name |
| Plan | Current plan type |
| Status | Active, Trial, Suspended, Cancelled, Past Due |
| Modules | Enabled modules count |
| MRR | Monthly recurring revenue |
| Start Date | Subscription start date |
| End Date | Subscription end date |
| Actions | View, Edit, Suspend, Cancel |

### 6.2 Plan Management

**Plan Tiers:**
| Plan | Price | Users | Storage | Modules |
|------|-------|-------|---------|---------|
| **Starter** | $799/mo | 5 | 1 GB | CRM, CPQ, Documents |
| **Professional** | $1,399/mo | 15 | 5 GB | CRM, CPQ, CLM, Documents |
| **Commercial** | $2,299/mo | 30 | 10 GB | CRM, CPQ, CLM, ERP, Documents |
| **Enterprise** | $3,799/mo | Unlimited | Unlimited | All Modules |

**Plan Configuration:**
- Resource limits (users, storage, contacts, contracts, etc.)
- Module access
- Feature flags
- Pricing

### 6.3 Billing Management

**Features:**
- View payment history
- Process refunds
- Manage payment methods
- Generate invoices
- Export billing data

### 6.4 Revenue Analytics

- MRR/ARR trends
- Revenue by plan type
- Churn analysis
- Expansion revenue
- Customer lifetime value

---

## 7. Module Management Page

### 7.1 Module Overview

| Module | Description | Status |
|--------|-------------|--------|
| **CRM** | Customer Relationship Management | Active |
| **CPQ** | Configure, Price, Quote | Active |
| **CLM** | Contract Lifecycle Management | Active |
| **ERP** | Enterprise Resource Planning | Active |
| **Documents** | Document Management & E-Signatures | Active |

### 7.2 Module Configuration

**Features:**
- Enable/disable modules globally
- Configure module-specific settings
- Set module limits per plan
- View module adoption statistics

### 7.3 Module Usage Analytics

- Organizations using each module
- Feature usage within modules
- Performance metrics
- Error rates

---

## 8. Plan Configuration Page

### 8.1 Plan Management

**Features:**
- Create new plan tiers
- Modify existing plans
- Set resource limits
- Configure module access
- Set pricing

### 8.2 Resource Limits Configuration

| Resource | Description | Unit |
|----------|-------------|------|
| **Users** | Maximum users per organization | Count |
| **Storage** | Maximum storage capacity | MB/GB |
| **Contacts** | Maximum CRM contacts | Count |
| **Accounts** | Maximum CRM accounts | Count |
| **Leads** | Maximum CRM leads | Count |
| **Opportunities** | Maximum CRM opportunities | Count |
| **Products** | Maximum CPQ products | Count |
| **Quotes** | Maximum CPQ quotes per month | Count |
| **Contracts** | Maximum CLM contracts | Count |
| **Contract Templates** | Maximum CLM templates | Count |
| **Documents** | Maximum documents | Count |
| **Document Templates** | Maximum document templates | Count |
| **Suppliers** | Maximum ERP suppliers | Count |
| **Purchase Orders** | Maximum ERP purchase orders | Count |
| **E-Signatures** | Maximum e-signatures per month | Count |
| **API Calls** | Maximum API calls per month | Count |

### 8.3 Feature Flags

**Platform-Wide Features:**
- Enable/disable specific features
- A/B testing capabilities
- Beta feature rollout
- Maintenance mode

---

## 9. Audit Logs Page

### 9.1 Audit Log Viewer

**Features:**
- Real-time audit log stream
- Advanced filtering (date range, action, entity, user, organization)
- Search functionality
- Export capabilities

**Columns:**
| Column | Description |
|--------|-------------|
| Timestamp | Event timestamp |
| Action | Action performed (create, update, delete, login, etc.) |
| Entity | Entity type (organization, user, subscription, etc.) |
| Entity ID | Unique identifier |
| User | User who performed action |
| Organization | Organization context |
| IP Address | User's IP address |
| User Agent | User's browser/client |
| Details | Additional event details |

### 9.2 Audit Event Types

| Category | Events |
|----------|--------|
| **Authentication** | Login, logout, password reset, email verification |
| **Organization** | Create, update, suspend, cancel, delete |
| **User** | Create, update, suspend, delete, role change |
| **Subscription** | Create, update, suspend, cancel, upgrade, downgrade |
| **Billing** | Payment, refund, invoice generation |
| **Impersonation** | Start, end impersonation session |
| **System** | Configuration changes, feature flag updates |

### 9.3 Audit Log Analytics

- Event frequency by type
- User activity patterns
- Security event monitoring
- Compliance reporting

---

## 10. Security & Access Page

### 10.1 Platform Admin Management

**Features:**
- View all platform admins
- Add/remove platform admins
- Manage admin permissions
- View admin activity

### 10.2 Security Settings

**Configuration Options:**
- Password policies
- Session timeout settings
- Two-factor authentication requirements
- IP whitelisting
- API rate limiting
- CORS configuration

### 10.3 Access Control

**Features:**
- Role-based access control (RBAC) management
- Permission matrix visualization
- Access review tools
- Compliance reporting

### 10.4 Security Monitoring

- Failed login attempts
- Suspicious activity detection
- IP-based access tracking
- Session management

---

## 11. System Health & Operations Page

### 11.1 System Metrics

| Metric | Description | Threshold |
|--------|-------------|-----------|
| **API Response Time** | Average API response time | < 200ms |
| **Database Query Time** | Average database query time | < 100ms |
| **Error Rate** | Percentage of failed requests | < 1% |
| **Uptime** | Platform availability | > 99.9% |
| **Active Connections** | Current database connections | < 100 |
| **Memory Usage** | Server memory utilization | < 80% |
| **CPU Usage** | Server CPU utilization | < 70% |
| **Storage Usage** | Total storage consumed | < 80% |

### 11.2 Background Jobs

**Features:**
- View job queue status
- Monitor job processing
- Retry failed jobs
- Cancel pending jobs
- View job history

**Job Types:**
- `document.generate` - Document generation
- `document.generate_pdf` - PDF generation
- `email.send` - Email sending
- `email.reminder` - Email reminders
- `contract.expiry_alert` - Contract expiry alerts

### 11.3 Database Management

**Features:**
- View database statistics
- Monitor table sizes
- View slow queries
- Database backup status
- Migration history

### 11.4 API Management

**Features:**
- API usage statistics
- Rate limiting configuration
- API key management
- Endpoint monitoring
- Error tracking

---

## 12. Analytics Page

### 12.1 Platform Analytics

**Metrics:**
- Total organizations (growth trend)
- Total users (growth trend)
- Revenue (MRR/ARR)
- Churn rate
- Customer acquisition cost (CAC)
- Customer lifetime value (CLV)
- Net promoter score (NPS)

### 12.2 Usage Analytics

**Metrics:**
- Feature adoption rates
- Module usage statistics
- User engagement metrics
- Session duration
- Page views
- API usage

### 12.3 Business Intelligence

**Reports:**
- Revenue forecast
- Growth projections
- Customer segmentation
- Cohort analysis
- Retention analysis

---

## 13. Settings Page

### 13.1 Platform Configuration

**Settings:**
- Platform name and branding
- Default organization settings
- Email templates
- Notification settings
- Integration settings (Supabase, Resend, etc.)

### 13.2 Feature Flags

**Features:**
- Enable/disable platform features
- A/B testing configuration
- Beta feature management
- Maintenance mode

### 13.3 Email Configuration

**Settings:**
- SMTP configuration
- Email templates
- Notification preferences
- Email sending limits

### 13.4 Integration Settings

**Integrations:**
- Supabase configuration
- Resend (email service)
- Razorpay (payment gateway)
- Analytics services
- Monitoring services

---

## 14. UI/UX Design Guidelines

### 14.1 Design Principles

1. **Clarity** - Clear hierarchy and information architecture
2. **Efficiency** - Quick access to common actions
3. **Consistency** - Consistent with existing platform design
4. **Accessibility** - WCAG 2.1 AA compliance
5. **Responsiveness** - Mobile-first design approach

### 14.2 Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| **Primary** | Brand primary color | Primary actions, links |
| **Success** | Green | Positive actions, active status |
| **Warning** | Yellow/Orange | Warnings, trial status |
| **Danger** | Red | Destructive actions, errors |
| **Info** | Blue | Information, neutral status |
| **Muted** | Gray | Secondary text, disabled states |

### 14.3 Typography

| Element | Font Size | Font Weight |
|---------|-----------|-------------|
| **Page Title** | 2xl (24px) | Bold |
| **Section Title** | xl (20px) | Semibold |
| **Card Title** | lg (18px) | Semibold |
| **Body Text** | base (16px) | Regular |
| **Small Text** | sm (14px) | Regular |
| **Caption** | xs (12px) | Regular |

### 14.4 Component Library

**Cards:**
- Rounded corners (xl/2xl)
- Subtle border
- Shadow on hover
- Backdrop blur for depth

**Buttons:**
- Primary: Filled with brand color
- Secondary: Outlined
- Ghost: No background
- Destructive: Red filled/outlined

**Tables:**
- Striped rows for readability
- Hover highlighting
- Sortable columns
- Pagination

**Forms:**
- Clear labels
- Validation states
- Error messages
- Helper text

### 14.5 Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ Header (Logo, Title, Theme Toggle, User Menu)          │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │           Main Content Area              │
│              │                                          │
│  - Overview  │  ┌────────────────────────────────────┐  │
│  - Orgs      │  │ Page Header (Title, Description)   │  │
│  - Users     │  ├────────────────────────────────────┤  │
│  - Billing   │  │ Stats Cards (4 columns)            │  │
│  - Modules   │  ├────────────────────────────────────┤  │
│  - Plans     │  │ Main Content (Tables, Charts, etc) │  │
│  - Audit     │  │                                    │  │
│  - Security  │  │                                    │  │
│  - System    │  │                                    │  │
│  - Analytics │  │                                    │  │
│  - Settings  │  └────────────────────────────────────┘  │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

---

## 15. Technical Implementation

### 15.1 File Structure

```
src/workspaces/platform/
├── layout/
│   ├── PlatformAdminLayout.tsx (existing)
│   └── ImpersonationBanner.tsx (existing)
├── pages/
│   ├── PlatformAdminDashboard.tsx (existing - enhance)
│   ├── OrganizationsPanel.tsx (new)
│   ├── OrganizationDetailPage.tsx (new)
│   ├── UsersPanel.tsx (existing - enhance)
│   ├── UserDetailPage.tsx (new)
│   ├── SubscriptionsPanel.tsx (new)
│   ├── ModulesPanel.tsx (new)
│   ├── PlansPanel.tsx (new)
│   ├── AuditLogsPanel.tsx (existing - enhance)
│   ├── SecurityPanel.tsx (new)
│   ├── SystemPanel.tsx (new)
│   ├── AnalyticsPanel.tsx (new)
│   └── SettingsPanel.tsx (existing - enhance)
├── hooks/
│   ├── usePlatformDashboard.ts (existing - enhance)
│   ├── useOrganizations.ts (new)
│   ├── useUsers.ts (new)
│   ├── useSubscriptions.ts (new)
│   ├── useModules.ts (new)
│   ├── usePlans.ts (new)
│   ├── useAuditLogs.ts (new)
│   ├── useSecurity.ts (new)
│   ├── useSystemHealth.ts (new)
│   └── useAnalytics.ts (new)
├── components/
│   ├── OrganizationCard.tsx (new)
│   ├── UserCard.tsx (new)
│   ├── SubscriptionCard.tsx (new)
│   ├── ModuleCard.tsx (new)
│   ├── PlanCard.tsx (new)
│   ├── AuditLogRow.tsx (new)
│   ├── SecurityAlert.tsx (new)
│   ├── SystemMetric.tsx (new)
│   └── AnalyticsChart.tsx (new)
└── types/
    └── platform.ts (new)
```

### 15.2 Database Queries

**Organizations:**
```sql
-- Get all organizations with user counts
SELECT 
  o.*,
  COUNT(DISTINCT om.user_id) as active_users,
  os.plan_type,
  os.status as subscription_status
FROM organizations o
LEFT JOIN organization_memberships om ON o.id = om.organization_id AND om.is_active = true
LEFT JOIN organization_subscriptions os ON o.id = os.organization_id
GROUP BY o.id, os.plan_type, os.status
ORDER BY o.created_at DESC;
```

**Users:**
```sql
-- Get all users with organization details
SELECT 
  p.*,
  om.role,
  om.organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  om.account_state,
  om.is_active,
  om.last_login_at
FROM profiles p
JOIN organization_memberships om ON p.user_id = om.user_id
JOIN organizations o ON om.organization_id = o.id
ORDER BY om.created_at DESC;
```

**Subscriptions:**
```sql
-- Get subscription details with organization info
SELECT 
  os.*,
  o.name as organization_name,
  o.slug as organization_slug,
  o.status as organization_status
FROM organization_subscriptions os
JOIN organizations o ON os.organization_id = o.id
ORDER BY os.updated_at DESC;
```

**Audit Logs:**
```sql
-- Get audit logs with user and organization details
SELECT 
  al.*,
  p.full_name as user_name,
  o.name as organization_name,
  o.slug as organization_slug
FROM audit_logs al
LEFT JOIN profiles p ON al.user_id = p.user_id
LEFT JOIN organizations o ON al.organization_id = o.id
ORDER BY al.created_at DESC
LIMIT 200;
```

### 15.3 API Endpoints (Supabase RPCs)

**Organization Management:**
```sql
-- Create organization
CREATE OR REPLACE FUNCTION create_organization(
  p_name text,
  p_slug text,
  p_org_code text,
  p_owner_user_id uuid,
  p_plan_type text DEFAULT 'starter'
) RETURNS uuid;

-- Update organization
CREATE OR REPLACE FUNCTION update_organization(
  p_organization_id uuid,
  p_name text DEFAULT NULL,
  p_slug text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_plan_type text DEFAULT NULL
) RETURNS boolean;

-- Suspend organization
CREATE OR REPLACE FUNCTION suspend_organization(
  p_organization_id uuid
) RETURNS boolean;

-- Delete organization (soft-delete)
CREATE OR REPLACE FUNCTION delete_organization(
  p_organization_id uuid
) RETURNS boolean;
```

**User Management:**
```sql
-- Create user in organization
CREATE OR REPLACE FUNCTION create_user(
  p_organization_id uuid,
  p_email text,
  p_role text,
  p_full_name text DEFAULT NULL
) RETURNS uuid;

-- Update user role
CREATE OR REPLACE FUNCTION update_user_role(
  p_user_id uuid,
  p_organization_id uuid,
  p_new_role text
) RETURNS boolean;

-- Suspend user
CREATE OR REPLACE FUNCTION suspend_user(
  p_user_id uuid,
  p_organization_id uuid
) RETURNS boolean;
```

**Subscription Management:**
```sql
-- Update subscription
CREATE OR REPLACE FUNCTION update_subscription(
  p_organization_id uuid,
  p_plan_type text DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_module_crm boolean DEFAULT NULL,
  p_module_clm boolean DEFAULT NULL,
  p_module_cpq boolean DEFAULT NULL,
  p_module_erp boolean DEFAULT NULL,
  p_module_documents boolean DEFAULT NULL
) RETURNS boolean;
```

### 15.4 Route Configuration

```typescript
// In App.tsx
<Route
  path="/platform"
  element={
    <PlatformAdminRoute>
      <PlatformAdminLayout />
    </PlatformAdminRoute>
  }
>
  <Route index element={<PlatformAdminDashboard />} />
  <Route path="organizations" element={<OrganizationsPanel />} />
  <Route path="organizations/:id" element={<OrganizationDetailPage />} />
  <Route path="users" element={<UsersPanel />} />
  <Route path="users/:id" element={<UserDetailPage />} />
  <Route path="subscriptions" element={<SubscriptionsPanel />} />
  <Route path="modules" element={<ModulesPanel />} />
  <Route path="plans" element={<PlansPanel />} />
  <Route path="audit-logs" element={<AuditLogsPanel />} />
  <Route path="security" element={<SecurityPanel />} />
  <Route path="system" element={<SystemPanel />} />
  <Route path="analytics" element={<AnalyticsPanel />} />
  <Route path="settings" element={<SettingsPanel />} />
</Route>
```

---

## 16. Security Considerations

### 16.1 Access Control

- **Platform Admin Route Guard**: Only `platform_super_admin` role can access `/platform/*` routes
- **Impersonation Audit**: All impersonation sessions are logged with timestamps
- **Session Management**: Platform admin sessions have shorter timeout (15 minutes)
- **IP Whitelisting**: Optional IP-based access restriction for platform admins

### 16.2 Data Protection

- **Encryption**: All sensitive data encrypted at rest and in transit
- **Audit Logging**: All platform admin actions logged
- **Data Export Controls**: Export functionality requires additional confirmation
- **Soft Delete**: All deletions are soft-deletes with recovery capability

### 16.3 Compliance

- **GDPR**: User data export and deletion capabilities
- **SOC 2**: Audit logging and access controls
- **Data Retention**: Configurable data retention policies
- **Privacy**: User privacy settings and consent management

---

## 17. Performance Considerations

### 17.1 Optimization Strategies

1. **Pagination**: All lists paginated (50 items per page)
2. **Caching**: Dashboard metrics cached for 60 seconds
3. **Lazy Loading**: Pages loaded on-demand
4. **Debounced Search**: Search inputs debounced (300ms)
5. **Virtual Scrolling**: Large lists use virtual scrolling
6. **Database Indexing**: Proper indexes on frequently queried columns

### 17.2 Monitoring

- **Query Performance**: Monitor slow queries (> 100ms)
- **API Response Time**: Track API endpoint performance
- **Error Rates**: Monitor error rates by endpoint
- **Resource Usage**: Track memory and CPU usage

---

## 18. Future Enhancements

### 18.1 Phase 2 Features

1. **Advanced Analytics**
   - Predictive analytics
   - Machine learning insights
   - Custom report builder

2. **Automation**
   - Automated organization provisioning
   - Scheduled reports
   - Automated alerts

3. **Integration**
   - Third-party integrations (Salesforce, HubSpot, etc.)
   - Webhook management
   - API marketplace

4. **White-Labeling**
   - Custom branding per organization
   - Custom domain support
   - White-label mobile apps

### 18.2 Phase 3 Features

1. **Multi-Region Support**
   - Geographic data distribution
   - Region-specific configurations
   - Data sovereignty compliance

2. **Advanced Security**
   - Multi-factor authentication
   - Biometric authentication
   - Zero-trust architecture

3. **Enterprise Features**
   - Single sign-on (SSO)
   - SAML integration
   - Advanced role-based access control

---

## 19. Implementation Roadmap

### Phase 1: Core Platform Admin (Weeks 1-4)
- [ ] Enhance dashboard with key metrics
- [ ] Implement organization management
- [ ] Enhance user management
- [ ] Implement subscription management

### Phase 2: Advanced Features (Weeks 5-8)
- [ ] Implement module management
- [ ] Implement plan configuration
- [ ] Enhance audit logs
- [ ] Implement security panel

### Phase 3: Analytics & Operations (Weeks 9-12)
- [ ] Implement analytics dashboard
- [ ] Implement system health monitoring
- [ ] Enhance settings panel
- [ ] Implement background job management

### Phase 4: Polish & Optimization (Weeks 13-16)
- [ ] Performance optimization
- [ ] UI/UX polish
- [ ] Documentation
- [ ] Testing and QA

---

## 20. Success Metrics

### 20.1 Platform Health Metrics

- **Uptime**: > 99.9%
- **API Response Time**: < 200ms (95th percentile)
- **Error Rate**: < 1%
- **Customer Satisfaction**: > 4.5/5

### 20.2 Business Metrics

- **MRR Growth**: > 10% month-over-month
- **Churn Rate**: < 5% monthly
- **Customer Acquisition Cost**: < $500
- **Customer Lifetime Value**: > $10,000

### 20.3 Operational Metrics

- **Support Ticket Resolution**: < 24 hours
- **Feature Release Frequency**: > 2 per month
- **Bug Fix Time**: < 48 hours
- **Documentation Coverage**: > 90%

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Platform Super Admin** | Highest-level role representing SaaS company owner |
| **Organization** | Tenant company using the SISWIT platform |
| **Subscription** | Organization's plan and module access |
| **Module** | Feature set (CRM, CPQ, CLM, ERP, Documents) |
| **Plan** | Pricing tier with specific limits and features |
| **Impersonation** | Admin accessing platform as another user |
| **Audit Log** | Record of all platform events and actions |
| **MRR** | Monthly Recurring Revenue |
| **ARR** | Annual Recurring Revenue |
| **Churn** | Rate at which customers cancel subscriptions |

---

## Appendix B: Related Documentation

- [`README.md`](../README.md) - Project overview
- [`docs/loginSystem.md`](loginSystem.md) - Authentication system
- [`docs/data-ownership.md`](data-ownership.md) - Data ownership patterns
- [`docs/background-jobs.md`](background-jobs.md) - Background job system
- [`src/core/types/roles.ts`](../src/core/types/roles.ts) - Role definitions
- [`src/core/rbac/usePermissions.ts`](../src/core/rbac/usePermissions.ts) - Permission system

---

**Document Version**: 1.0  
**Last Updated**: 2026-03-30  
**Author**: Sunny
**Status**: Draft - Pending Review
