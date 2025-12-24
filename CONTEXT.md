# Tops Lighting Signage Dashboard - Context

## Overview
A comprehensive dashboard application for managing a signage installation business. The app handles technician management, equipment tracking, vehicle fleet management, and AI-powered work order processing.

## What This App Does
- **Technician Management**: Track technicians, their skills, contact information, and availability
- **Office Staff Directory**: Manage office staff members and their roles
- **Equipment Management**: Monitor equipment inventory, status (available/in-use/maintenance), and types
- **Vehicle Fleet Management**: Track company vehicles, license plates, VIN, GVW, driver assignments, and maintenance status
- **AI-Powered Work Order Processing**: Upload multiple work order files (PDF/images), automatically extract job details using Google's Gemini AI, and view structured analysis
- **Resource Planning**: Match work orders with required technicians, equipment, and vehicles
- **Scheduling & Review**: Track estimated days, scheduling notes, and multiple planned dates. Review needed workflow for missing info.

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
- **Google Gemini 3 Flash Preview** - AI model for work order analysis
  - Native PDF and image support via `inlineData`
  - Structured JSON output with `responseMimeType: 'application/json'`
  - Extracts tasks, requirements, dates, and scope of work

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
│   │   ├── settings/             # Settings & Admin (requires permissions)
│   │   │   ├── job-types/        # Job Type management
│   │   │   │   └── page.tsx
│   │   │   ├── roles/            # Role management
│   │   │   │   └── page.tsx
│   │   │   └── users/            # User management
│   │   │       └── page.tsx
│   │   ├── profile/              # User Profile
│   │   │   └── page.tsx
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
│   │   ├── WorkOrderReviewModal.tsx  # Post-upload review/enrichment modal
│   │   ├── FileViewerModal.tsx    # In-app PDF/image viewer
│   │   ├── WorkOrderTasks.tsx     # Task management with checklists
│   │   ├── TaskCommentsPanel.tsx  # Threaded comments with @mentions
│   │   ├── CategorySelector.tsx   # WO-scoped category dropdown
│   │   ├── TagSelector.tsx        # Global tag multi-select
│   │   ├── ShippingComments.tsx   # Threaded shipping comment system
│   │   ├── ShipmentManager.tsx    # Shipment tracking UI
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
The app uses **Google OAuth only** for authentication via Supabase Auth. Users must be **pre-invited** by an admin before they can access the dashboard.

### Invitation System
Admins pre-register users by creating invitations with email, name, role, and user types (technician/office staff). Users claim their invitation on first sign-in.

### Auth Flow
1. **Admin invites user**: Creates invitation via Settings > Users > Invite User
2. User visits `/` → redirected to `/login` (if not authenticated)
3. User clicks "Sign in with Google"
4. Google redirects back to `/auth/callback`
5. Callback checks for existing profile OR invitation
6. **Invitation found**: Creates profile + extension records, marks invitation claimed
7. **No invitation**: Redirects to `/unauthorized` page
8. **New users**: Redirected to `/onboarding` to complete profile setup
9. **Returning users**: Redirected to `/dashboard`

### Onboarding Flow
New users are required to complete their profile before accessing the dashboard:
- **Step 1**: Avatar (editable), Nick Name (editable), Phone (required), Name (read-only from invitation)
- **Step 2**: Review card showing all info including assigned **RBAC Role**
- User type (`internal`/`external`) is **derived from the assigned role**, not manually set

### Protected Routes
- All `/dashboard/*` routes require authentication AND completed onboarding
- `/onboarding` route requires authentication but NOT completed onboarding
- Middleware automatically redirects users based on their onboarding status
- Authenticated users on `/login` are redirected appropriately

### Client Portal (External Access)
The app has a **separate authentication flow** for external client contacts:

#### Dual Auth Model
| User Type | Auth Method | Login URL | Destination |
|-----------|-------------|-----------|-------------|
| Internal Team | Google OAuth | `/login` | `/dashboard` |
| Client Contacts | Email/Password | `/client-login` | `/client-dashboard` |

#### Client Account Creation
1. Admin navigates to **Clients → [Client Name] → Client Contacts**
2. Clicks **"Create Portal"** button on a PM row
3. Generates or enters a password
4. Copies credentials to share with the client contact

#### Client User Profile
- `user_types: ['client']` - Identifies portal users
- `project_managers.user_profile_id` - Links PM to auth account
- Clients skip onboarding flow (`onboarding_completed: true`)

#### Client Routes
- `/client-login` - Allows unauthenticated access
- `/client-dashboard` - Requires auth + validates `user_types` includes `'client'`



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
- AI extracts structured information (Job type, Client, Resources, etc.)
- **Advanced Management**:
  - Filter by Status, Job Type, Client, and Date
  - Text search across multiple fields
  - Customizable table view with "Job Type" and "Uploaded By" details

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
- ~~Task comments with @mentions and attachments~~ ✅ Implemented (Phase 16)
- ~~Task categories and global tags~~ ✅ Implemented (Phase 17)
- Admin panel for assigning user titles *(use RBAC admin pages now)*
- Work order assignment to technicians
- Calendar/scheduling view
- Mobile app (React Native)
- Real-time notifications (including @mention alerts)
- Analytics and reporting (with category/tag filtering)
- Equipment maintenance tracking
- Vehicle GPS tracking integration

### 6. Team Tab & Chat (Phase 18)
- **Team Roster**: View WO Owner, Office Staff (add/remove), Technicians
- **Office Staff Assignment**: Manage team members during WO creation or via Team tab
- **Real-time Team Chat**: Supabase Realtime powered chat for team coordination
- **File References**: Attach WO files to chat messages (grouped by category)
- **Edit/Delete Messages**: Hover to reveal action menu on own messages
- **Access Control**: RLS + UI check for team-only visibility

#### Database Tables
- `work_order_team`: Office staff assignments to work orders
- `work_order_chat_messages`: Team chat with file references, edit tracking, soft delete

#### UI Components
| Component | Purpose |
|-----------|---------|
| `WorkOrderTeamTab` | Main container with roster and chat |
| `TeamRoster` | WO Owner, Office Staff (editable), Technicians |
| `TeamChat` | Real-time chat panel |
| `ChatMessage` | Single message with hover actions |
| `ChatInput` | Message input with file picker |

### 7. Company Settings (Phase 27)
- **Company Info Page**: `/dashboard/settings/company`
- **Single-row settings table**: Enforced via database constraint
- **Fields**: Name, logo, phone, email, website, full address, tax ID
- **Logo Upload**: Upload to `company-assets` storage bucket with preview
- **Permission**: `settings:manage_company` required

### 8. Client Hub (Phase 28)
- **Purpose**: Client-facing communication channel (separate from Team Chat)
- **Visual Differentiation**: Purple accent color

#### Access Control
- WO owners, internal team (non-technicians), Primary PM, additional authorized PMs
- Technicians see "Access Restricted" message
- No client assigned shows empty state

#### Features
- **Contact Hierarchy**: Primary PM (purple badge) + additional contacts
- **Portal Badges**: "No Portal Access" badge for PMs without user accounts
- **Add/Remove Contacts**: Limited to PMs from the same client
- **Real-time Chat**: Supabase Realtime enabled
- **Sender Display**: "(Company Name)" for internal, "(Client Name)" for external
- **File Uploads**: PDF/images via chat (requires message)

#### Database Tables
- `work_order_client_access`: Additional client contacts junction table
- `work_order_client_chat`: Client-facing messages with `sender_company_name`

#### SQL Function
```sql
can_access_client_hub(wo_id UUID) RETURNS BOOLEAN
```

#### UI Components
| Component | Purpose |
|-----------|---------|
| `ClientHubTab` | Main container with access control |
| `ContactHierarchy` | Primary PM + additional contacts |
| `ClientChat` | Real-time chat with purple theme |


### 9. Client Portal (Phase 29)
- **Purpose**: External client-facing portal for Project Managers
- **URL**: `/client-dashboard`
- **Authentication**: Email/password (separate from internal OAuth)

#### Features
- **Work Order Selector**: Access WOs where PM is primary or additional contact
- **Real-time Chat**: Supabase Realtime subscription (same as Client Hub)
- **PDF Export**: Chat history with company branding, WO details, contact info
- **File Downloads**: Only files marked `is_client_visible = true`

#### File Visibility Management
- Per-file `is_client_visible` boolean flag
- Managed from Client Hub tab via `ClientFilesManager` component
- Thumbnails with one-click share/unshare toggle

#### UI Components
| Component | Purpose |
|-----------|---------|-|
| `app/client-dashboard/page.tsx` | Main portal page with tabs |
| `ClientFilesManager` | Internal file visibility toggle UI |

#### Service Layer
- `services/client-portal.service.ts` - 7 methods for portal operations
- `services/work-orders.service.ts` - 2 new file visibility methods

