# Sirius Infra Unified Platform

A comprehensive, modern unified platform that integrates CRM, CLM (Contract Lifecycle Management), and CPQ (Configure, Price, Quote) modules into a single, cohesive application. Built with React, TypeScript, and cutting-edge technologies for enterprise-grade functionality.

## Overview

The Sirius Infra Unified Platform is designed to streamline business operations across multiple domains. It provides integrated solutions for managing customer relationships, contracts, and quotes within a unified dashboard architecture.

### Key Features

- **CRM Module**: Comprehensive customer relationship management with accounts, contacts, opportunities, and activities tracking
- **CLM Module**: End-to-end contract lifecycle management with templates, building, scanning, and e-signature capabilities
- **CPQ Module**: Configure, price, and quote functionality for efficient sales operations
- **Admin Dashboard**: Centralized administrative controls and user management
- **Role-Based Access Control**: Secure authentication and authorization with role-based permissions
- **Real-time Collaboration**: Supabase integration for real-time data synchronization
- **Responsive UI**: Beautiful, modern interface built with shadcn/ui and Tailwind CSS

## Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React component library
- **React Query** - Server state management and data fetching
- **React Hook Form** - Efficient form management

### Backend & Data
- **Supabase** - PostgreSQL database, authentication, and real-time features
- **Supabase Client** - Type-safe database operations

### Developer Tools
- **ESLint** - Code quality and consistency
- **PostCSS** - CSS transformations
- **Bun** - Fast package manager and runtime

## Project Structure

```
src/
├── components/
│   ├── auth/              # Authentication components (SignIn, SignUp, Role Selection)
│   ├── crm/               # CRM-specific components (Dashboard, DataTable, Pipeline)
│   ├── clm/               # Contract lifecycle management components
│   ├── cpq/               # Configure, price, quote components
│   ├── layout/            # Layout components (Header, Footer)
│   ├── sections/          # Landing page sections
│   ├── ui/                # Reusable UI components (shadcn/ui)
│   └── common/            # Common shared components
├── pages/
│   ├── Auth.tsx           # Authentication page
│   ├── Dashboard.tsx      # Main dashboard
│   ├── AdminDashboard.tsx # Admin controls
│   ├── crm/               # CRM module pages
│   ├── clm/               # CLM module pages
│   ├── cpq/               # CPQ module pages
│   └── ...other pages
├── hooks/
│   ├── useAuth.tsx        # Authentication logic
│   ├── useCRM.ts          # CRM data management
│   ├── use-toast.ts       # Toast notifications
│   └── use-mobile.tsx     # Mobile detection
├── integrations/
│   └── supabase/          # Supabase client configuration and types
├── types/
│   ├── crm.ts             # CRM TypeScript types
│   └── roles.ts           # Role definitions
├── lib/
│   └── utils.ts           # Utility functions
└── data/
    └── leadershipData.ts  # Static data
```

## Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Bun** package manager or npm/yarn
- Git

### Installation

1. **Clone the repository**:
   ```sh
   git clone <repository-url>
   cd siriusinfra-unified-platform
   ```

2. **Install dependencies**:
   ```sh
   bun install
   # or
   npm install
   ```

3. **Environment Configuration**:
   Create a `.env.local` file in the root directory with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**:
   ```sh
   bun run dev
   # or
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Available Scripts

- `bun run dev` - Start development server with hot module replacement
- `bun run build` - Build for production
- `bun run build:dev` - Build in development mode
- `bun run lint` - Run ESLint to check code quality
- `bun run preview` - Preview production build locally

## Authentication & Authorization

The platform implements role-based access control with multiple user roles:

- **Admin**: Full platform access and administrative capabilities
- **Customer**: Customer-facing dashboard and limited CRM features
- **Employee**: Full CRM, CLM, and CPQ module access

Users authenticate via Supabase and are assigned roles during the signup process.

## Module Documentation

### CRM Module
Located in `src/pages/crm/` - Manage accounts, contacts, opportunities, and activities with a comprehensive dashboard and real-time updates.

### CLM Module
Located in `src/pages/clm/` - Create, manage, scan, and execute contracts with template support and e-signature capabilities.

### CPQ Module
Located in `src/pages/cpq/` - Configure products, build quotes, and manage the sales pipeline efficiently.

## Database Schema

The project uses Supabase PostgreSQL with migrations located in `supabase/migrations/`. Key tables include:
- Users (authentication and roles)
- Accounts, Contacts, Opportunities (CRM)
- Contracts, Templates (CLM)
- Products, Quotes (CPQ)

## Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes and commit them: `git commit -m 'Add your feature'`
3. Push to the branch: `git push origin feature/your-feature`
4. Create a pull request for review

## Code Quality

This project uses ESLint for code quality. Run the linter before committing:

```sh
bun run lint
```

## Deployment

Build the production version:

```sh
bun run build
```

This creates an optimized build in the `dist/` directory ready for deployment.

## Support & Contributing

For issues, feature requests, or contributions, please open an issue or pull request in the repository.

## License

This project is proprietary and confidential.

---

**Last Updated**: January 2026
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
