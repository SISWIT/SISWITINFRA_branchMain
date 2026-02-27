# Project Restructuring Proposal

The current structure of the `src` directory groups files by technical concern (e.g., all `components` together, all `pages` together, all `hooks` together). Given the scale of the SiriusInfra Unified Platform (combining CRM, CPQ, CLM, ERP, etc.), this structure makes the codebase difficult to navigate and maintain.

To improve readability, maintainability, and scalability, we propose migrating to a **Feature-Driven** (or Domain-Driven) architecture.

## Proposed Directory Structure

```text
src/
├── app/                  # App-wide settings, routing, and providers
│   ├── routes/           # Centralized routing configurations
│   ├── providers/        # Global React context providers
│   └── App.tsx           # Main application entry point
│
├── core/                 # Shared, cross-feature core logic
│   ├── api/              # API and database clients (Supabase setup)
│   ├── auth/             # Authentication logic and role management
│   ├── integrations/     # Third-party integrations
│   ├── types/            # Global TypeScript types (e.g., app-wide generics)
│   └── utils/            # Global helper utility functions
│
├── components/           # Generic, reusable UI components (e.g., Shadcn UI)
│   ├── ui/               # Base UI components (buttons, inputs, dialogs)
│   ├── layout/           # Shared layout components (navbars, sidebars)
│   └── shared/           # Features-agnostic complex components
│
├── features/             # Feature-based modules (Domain Logic)
│   ├── crm/              # Customer Relationship Management
│   │   ├── components/   # CRM-specific UI components
│   │   ├── hooks/        # CRM-specific React hooks
│   │   ├── pages/        # CRM route pages
│   │   └── types/        # CRM types/interfaces
│   │
│   ├── cpq/              # Configure, Price, Quote
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── types/
│   │
│   ├── clm/              # Contract Lifecycle Management
│   │   └── ...
│   │
│   ├── erp/              # Enterprise Resource Planning
│   │   └── ...
│   │
│   ├── documents/        # Auto Documentation & Signatures
│   │   └── ...
│   │
│   ├── admin/            # Platform Administration
│   │   └── ...
│   │
│   ├── organization/     # Tenant/Organization settings & user management
│   │   └── ...
│   │
│   └── portal/           # Client/Customer Portal views
│       └── ...
│
├── assets/               # Static assets (images, icons, fonts)
└── styles/               # Global CSS and Tailwind configurations
    └── index.css
```

## Benefits of this Restructure

1. **High Cohesion**: Everything related to a specific feature (like CRM) is located in one place. Developers working on the CRM module don't have to jump between global `pages`, `components`, and `hooks` folders.
2. **Scalability**: As more modules are added to the SaaS application, they simply become a new folder under `features/` without bloating global directories.
3. **Readability**: Code boundaries are explicitly clear. It prevents feature-specific logic from "leaking" into global directories.
4. **Easier Code Splitting**: Setting up dynamic imports and varying bundle sizes per feature becomes substantially more straightforward.
