# SiriusInfra Unified Platform

## Overview
SiriusInfra Unified Platform is a comprehensive, multi-tenant SaaS application that integrates several enterprise business modules into a single, cohesive ecosystem. The platform empowers organizations to seamlessly manage their operations, resources, and customer relationships through role-based access control and scalable architecture.

## Products & Modules
The platform currently encompasses the following core products:
- **CRM (Customer Relationship Management)**: Manage leads, opportunities, accounts, contacts, and pipeline activities.
- **CPQ (Configure, Price, Quote)**: Build and manage complex quotes, product catalogs, and pricing strategies.
- **CLM (Contract Lifecycle Management)**: Handle contract generation, negotiation, execution, and repository management.
- **ERP (Enterprise Resource Planning)**: Oversee inventory, procurement, production, and financial operations.
- **Auto Documentation & E-Sign**: Generate customized documents from templates and manage the end-to-end e-signature workflow.

## User Roles & Workflows

### 1. Organization Onboarding
- **Sign Up**: An Organization signs up for the platform and becomes a **Tenant**.
- **Subscription**: The Organization purchases a subscription plan that determines which products (CRM, ERP, etc.) they can access.

### 2. Role-Based Access Control (RBAC)
Once the Organization is set up, the **Organization Owner** or **Admin** can invite users to the platform and assign specific roles.
- **Platform Admin / Super Admin**: Manages the entire SaaS infrastructure, handles tenant billing, system-wide settings, and global audit logs.
- **Organization Owner**: Full control over the tenant's workspace, billing, users, and overall organizational settings.
- **Organization Admin**: Administrative control over the organization's settings and user management, similar to the owner but potentially restricted from billing.
- **Manager**: Department or team leader with elevated privileges within specific modules.
- **Employee**: Standard user with access tailored to their department. For instance, a sales employee will only be granted access to CRM-related features (Leads, Opportunities).
- **Client**: External users invited by the organization to view specific proposals, quotes, or contracts with restricted access limited to their specific portal view.

### 3. Authentication & Login Flow
- **Invitation**: Users receive an invitation email containing an organization context.
- **Login**: Users authenticate using their email (e.g., Gmail) and password.
- **Routing**: Upon successful authentication, the system dynamically checks the user's role and associated organization (tenant slug).
- **Dashboard**: The user is then seamlessly redirected to their specific dashboard and granted access only to the data and products defined by their organization's subscription and their assigned role constraints.
