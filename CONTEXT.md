# Tops Lighting Signage Dashboard - Context

## Overview
A comprehensive dashboard application for managing a signage installation business. The app handles technician management, equipment tracking, vehicle fleet management, and AI-powered work order processing.

## What This App Does
- **Technician Management**: Track technicians, their skills, contact information, and availability
- **Equipment Management**: Monitor equipment inventory, status (available/in-use/maintenance), and types
- **Vehicle Fleet Management**: Track company vehicles, license plates, and maintenance status
- **AI-Powered Work Order Processing**: Upload work orders (PDF/images), automatically extract job details using Google's Gemini AI, and view structured analysis
- **Resource Planning**: Match work orders with required technicians, equipment, and vehicles

## Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (Google OAuth only)
  - Storage for work order files
  - Row Level Security (RLS)

### AI/ML
- **Google Gemini 2.5 Pro** - AI model for work order analysis
  - PDF text extraction and analysis
  - Image analysis (OCR and understanding)
  - Structured data extraction

### Key Dependencies
- `@supabase/supabase-js` - Supabase client
- `@supabase/ssr` - Supabase SSR authentication helpers
- `@google/generative-ai` - Gemini AI SDK
- `pdfjs-dist` - PDF processing utilities

## Folder Structure

```
signage-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── process-work-order/   # Work order AI processing endpoint
│   │       └── route.ts
│   ├── auth/                     # Authentication routes
│   │   └── callback/             # OAuth callback handler
│   │       └── route.ts
│   ├── login/                    # Login page (Google OAuth only)
│   │   └── page.tsx
│   ├── onboarding/               # User onboarding (profile setup)
│   │   └── page.tsx
│   ├── dashboard/                # Dashboard pages (protected)
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── admin/                # Admin pages (requires permissions)
│   │   │   ├── roles/            # Role management
│   │   │   │   └── page.tsx
│   │   │   └── users/            # User management
│   │   │       └── page.tsx
│   │   ├── technicians/          # Technician management
│   │   │   └── page.tsx
│   │   ├── equipment/            # Equipment management
│   │   │   └── page.tsx
│   │   ├── vehicles/             # Vehicle management
│   │   │   └── page.tsx
│   │   └── work-orders/          # Work order management
│   │       └── page.tsx
│   ├── demo/                     # Component demo page
│   │   └── page.tsx
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Redirect to login/dashboard
├── components/                   # Reusable React components
│   ├── ui/                       # UI primitives (Button, Input, Modal, etc.)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Alert.tsx
│   │   ├── Avatar.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── index.ts
│   ├── tables/                   # Table components
│   │   ├── DataTable.tsx
│   │   └── index.ts
│   ├── forms/                    # Form components
│   │   ├── TechnicianForm.tsx
│   │   ├── EquipmentForm.tsx
│   │   ├── VehicleForm.tsx
│   │   └── index.ts
│   ├── work-orders/              # Work order specific components
│   │   ├── WorkOrderUploadForm.tsx
│   │   ├── WorkOrderFilesModal.tsx
│   │   ├── WorkOrderAnalysisModal.tsx
│   │   └── index.ts
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── index.ts
│   ├── providers/                # React providers
│   │   ├── ToastProvider.tsx
│   │   └── index.ts
│   ├── ErrorBoundary.tsx         # Error boundary component
│   └── index.ts                  # Main barrel export
├── hooks/                        # Custom React hooks
│   ├── useAsync.ts               # Async operation hook
│   ├── useModal.ts               # Modal state hook
│   ├── useCrud.ts                # Generic CRUD hook
│   ├── useConfirmDialog.ts       # Confirmation dialog hook
│   ├── usePermissions.tsx        # RBAC permissions hook with context
│   └── index.ts
├── services/                     # Business logic services
│   ├── technicians.service.ts    # Technician CRUD operations
│   ├── equipment.service.ts      # Equipment CRUD operations
│   ├── vehicles.service.ts       # Vehicle CRUD operations
│   ├── work-orders.service.ts    # Work order operations
│   ├── rbac.service.ts           # Role-based access control operations
│   ├── crud.service.ts           # Generic CRUD factory
│   └── index.ts
├── lib/                          # Utility libraries
│   ├── supabase.ts               # Legacy Supabase client (backward compat)
│   ├── supabase/                 # Modern Supabase SSR clients
│   │   ├── client.ts             # Browser-side client (Client Components)
│   │   ├── server.ts             # Server-side client (Server Components)
│   │   ├── middleware.ts         # Middleware session helper
│   │   └── api.ts                # API route client
│   ├── utils.ts                  # Utility functions
│   └── constants.ts              # Application constants
├── types/                        # TypeScript type definitions
│   ├── database.ts               # Database table interfaces
│   ├── supabase.ts               # Supabase generated types
│   ├── rbac.ts                   # RBAC type definitions
│   └── user-profile.ts           # User profile types for onboarding
├── database_migrations/          # SQL migration files
│   ├── 001_initial_schema.sql    # Initial tables
│   ├── 002_user_profiles.sql     # User profiles table
│   └── 003_rbac_schema.sql       # Roles and permissions tables
├── middleware.ts                 # Next.js middleware (auth + onboarding)
├── public/                       # Static assets
├── .env.local                    # Environment variables (not in git)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── IMPLEMENTATION_PLAN.md        # Refactoring implementation plan
└── tsconfig.json                 # TypeScript configuration
```

## Environment Variables

Required environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional)

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key (if needed client-side)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Authentication

### Overview
The app uses **Google OAuth only** for authentication via Supabase Auth. Users must sign in with a Google account to access the dashboard.

### Auth Flow
1. User visits `/` → redirected to `/login` (if not authenticated)
2. User clicks "Sign in with Google"
3. Redirected to Google for authentication
4. Google redirects back to `/auth/callback`
5. Callback exchanges code for session
6. **New users** → redirected to `/onboarding` to complete profile setup
7. **Returning users** (profile complete) → redirected to `/dashboard`

### Onboarding Flow
New users are required to complete their profile before accessing the dashboard:
- **Required**: Display Name, Phone Number, Profile Picture
- **Optional**: Alternate Email
- **Admin-set**: Title/Role (set later by administrator)

### Protected Routes
- All `/dashboard/*` routes require authentication AND completed onboarding
- `/onboarding` route requires authentication but NOT completed onboarding
- Middleware automatically redirects users based on their onboarding status
- Authenticated users on `/login` are redirected appropriately


### Supabase Clients
- **Browser client** (`lib/supabase/client.ts`): For Client Components
- **Server client** (`lib/supabase/server.ts`): For Server Components and Route Handlers
- **Middleware client** (`lib/supabase/middleware.ts`): For session refresh in middleware
- **API client** (`lib/supabase/api.ts`): For API routes without user context

## Key Features

### 1. Dashboard Layout
- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- Consistent header with branding
- User email display and logout button

### 2. CRUD Operations
All entity pages support:
- **Create**: Add new records via forms
- **Read**: View all records in tables
- **Delete**: Remove records with confirmation

### 3. Work Order AI Processing
- Upload PDF or image work orders
- AI extracts structured information:
  - Job type and location
  - Client information
  - Resource requirements (skills, equipment, vehicles)
  - Staffing needs and timeline estimates
  - Permits, technical requirements, access needs
  - Risk factors and questions
- View analysis in formatted modal

### 4. Status Management
- Color-coded status badges
- Real-time status updates
- Visual indicators for availability

### 5. Role-Based Access Control (RBAC)
- **Permission-based access**: 37 permissions across 10 resources
- **Admin UI**: Manage roles at `/dashboard/admin/roles`
- **User Management**: Assign roles at `/dashboard/admin/users`
- **Conditional UI**: Sidebar items visibility based on permissions
- **React Integration**:
  - `PermissionsProvider` context wrapping dashboard
  - `usePermissions` hook for permission checks
  - `RequirePermission` component for conditional rendering
- **Default Role**: Super Admin with full system access
- **Resources**: users, roles, permissions, work_orders, technicians, equipment, vehicles, reports, settings, dashboard
- **Actions**: create, read, update, delete, manage, assign

## Development Workflow

1. **Local Development**: `npm run dev` (runs on http://localhost:3000)
2. **Database Changes**: Update SQL in Supabase dashboard
3. **Type Updates**: Modify `types/database.ts` to match schema
4. **API Routes**: Add new routes in `app/api/`
5. **Pages**: Create new pages in `app/dashboard/`
6. **Build**: `npm run build` to verify production build

## Session Log

Development sessions are tracked in `SESSION-LOG.md`. This file contains:
- Pre-session history (features built before formal logging)
- Dated session entries with objectives, changes, and commits

**Always update SESSION-LOG.md** at the end of each development session.

## Future Enhancements
- ~~User onboarding flow (profile completion after first sign-in)~~ ✅ Implemented
- ~~User profiles with name, phone, photo, role/title~~ ✅ Implemented
- ~~Role-based access control (Admin, Technician, etc.)~~ ✅ Implemented
- Admin panel for assigning user titles *(use RBAC admin pages now)*
- Work order assignment to technicians
- Calendar/scheduling view
- Mobile app (React Native)
- Real-time notifications
- Analytics and reporting
- Equipment maintenance tracking
- Vehicle GPS tracking integration

