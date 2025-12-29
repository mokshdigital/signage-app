# Tops Lighting Signage Dashboard - Session Log

This document tracks development sessions and changes made to the application over time.

---

## Pre-Session History (Before December 11, 2024)

The following features were implemented before formal session logging began:

### Initial Project Setup
- Created Next.js 16 application with TypeScript and Tailwind CSS
- Set up project structure with App Router
- Configured ESLint and TypeScript settings

### Authentication System
- Implemented Supabase authentication with Google OAuth only
- Created login page with Google sign-in button
- Built OAuth callback handler at `/auth/callback`
- Set up Next.js middleware for route protection
- Created Supabase client utilities:
  - Browser client (`lib/supabase/client.ts`)
  - Server client (`lib/supabase/server.ts`)
  - Middleware client (`lib/supabase/middleware.ts`)
  - API route client (`lib/supabase/api.ts`)

### Database Schema
Created the following tables in Supabase:
- `technicians` - Employee/technician records with skills tracking
- `equipment` - Equipment inventory with status management
- `vehicles` - Vehicle fleet tracking with license plates
- `work_orders` - Work order metadata and AI analysis storage
- `work_order_files` - Multiple files per work order support

### Dashboard Implementation
- Built responsive dashboard layout with sidebar navigation
- Created dashboard home page with overview stats
- Implemented mobile-friendly hamburger menu
- Added user info display and logout functionality

### Entity Management Pages
Created CRUD interfaces for:
- **Technicians** (`/dashboard/technicians`) - Add, view, delete technicians
- **Equipment** (`/dashboard/equipment`) - Manage equipment with status tracking
- **Vehicles** (`/dashboard/vehicles`) - Fleet management with status badges

### Work Order System
- Built work order upload page (`/dashboard/work-orders`)
- Implemented file upload to Supabase Storage
- Created API route for AI processing (`/api/process-work-order`)
- Integrated Google Gemini 2.5 Pro for work order analysis
- Built modal for displaying AI-extracted analysis
- Supports PDF and image files (JPG, PNG, WEBP, GIF)

### AI Analysis Features
The AI extracts structured information from work orders:
- Job type and location
- Client/contact information
- Resource requirements (skills, equipment, vehicles)
- Staffing needs and timeline estimates
- Permits and technical requirements
- Access needs and risk factors
- Questions for clients and technicians

### Documentation
- Created `CONTEXT.md` - Project overview and architecture
- Created `DATABASE_SCHEMA.md` - Complete database documentation
- Created `API_ENDPOINTS.md` - API route documentation
- Created `CURSOR_PROMPTS.md` - Development prompt templates
- Created `PHASE_LOG.md` - Development phase tracking
- Created `README.md` - Project readme

---

## Session Log

### Session 1 - December 11, 2024 (5:46 PM - 5:58 PM PST)

**Objective**: Implement user onboarding flow for Google sign-up users

**Changes Made**:

1. **Created Onboarding Page** (`/app/onboarding/page.tsx`)
   - Multi-step form with 3 steps:
     - Step 1: Display Name & Profile Picture
     - Step 2: Phone Number (required) & Alternate Email (optional)
     - Step 3: Review & Confirm
   - Glassmorphism design with beautiful UI
   - Pre-fills name and avatar from Google account
   - Progress indicator with step numbers
   - Form validation for required fields
   - Responsive design for mobile

2. **Created User Profile Types** (`/types/user-profile.ts`)
   - `UserProfile` interface
   - `OnboardingFormData` interface
   - `UserProfileUpdate` interface

3. **Updated Supabase Types** (`/types/supabase.ts`)
   - Added `user_profiles` table type definition

4. **Modified Auth Callback** (`/app/auth/callback/route.ts`)
   - Now checks if user has completed onboarding
   - Redirects new users to `/onboarding`
   - Redirects returning users to `/dashboard`

5. **Updated Middleware** (`/lib/supabase/middleware.ts`)
   - Added onboarding status checks
   - Protects `/dashboard/*` routes (requires completed onboarding)
   - Protects `/onboarding` route (requires authentication)
   - Redirects users without profiles to onboarding
   - Redirects users with complete profiles away from onboarding

6. **Created Database Migration** (`/database_migrations/002_user_profiles.sql`)
   - Creates `user_profiles` table
   - Fields: id, display_name, avatar_url, phone, alternate_email, title, onboarding_completed
   - RLS policies for user access control
   - Auto-update trigger for `updated_at`

7. **Updated Documentation**
   - `CONTEXT.md` - Added onboarding flow, updated folder structure
   - `DATABASE_SCHEMA.md` - Added user_profiles table documentation

**Pending Actions**:
- [x] Run SQL migration in Supabase Dashboard
- [ ] (Optional) Create `user-avatars` storage bucket for custom profile pictures

**Git Commit**: `feat: Add user onboarding flow for Google sign-up users`

---

### Session 2 - December 11, 2024 (6:02 PM - 8:34 PM PST)

**Objective**: Complete Phase 5 dashboard polish - Add toast notifications, error boundaries, and documentation updates

**Changes Made**:

1. **Toast Notification System**
   - Created `Toast` component with multiple variants (success, error, warning, info)
   - Created `ToastContainer` for managing multiple toasts
   - Created `useToast` hook with context provider
   - Integrated toast notifications across work orders, equipment, vehicles, technicians pages
   - Replaced all `alert()` calls with toast notifications

2. **Error Boundaries**
   - Created `ErrorBoundary` wrapper component
   - Added error boundary to dashboard layout
   - Graceful error handling with recovery options

3. **UI Component Updates**
   - Added `Alert` component for inline messages
   - Added `Avatar` and `AvatarGroup` components
   - Updated component exports in barrel files

### Session Update: Work Order Tasks & AI Integration
- **UI Implementation**:
    - Created `components/work-orders/WorkOrderTasks.tsx` to manage tasks, assignments, and checklists.
    - Integrated `WorkOrderTasks` into `app/dashboard/work-orders/[id]/page.tsx` (Detail Page).
    - Added "Tasks & Execution" section to the UI.
- **AI Integration**:
    - Updated `app/api/process-work-order/route.ts` prompt to extract `scope_of_work` and `suggested_tasks`.
    - Implemented logic to automatically create 'Pending' tasks in `work_order_tasks` upon AI processing.
- **Type Definitions**:
    - Manually updated `types/supabase.ts` to include `work_order_tasks`, `task_assignments`, `task_checklists`, `checklist_templates`, and `checklist_template_items`. This ensures type safety for the `createClient` used in API routes.
- **Refactoring & Fixes**:
    - Fixed lint errors in `Settings` page (imports, button variants).
    - Fixed lint errors in `WorkOrderTasks` (imports, button variants).

### Next Steps
- Manual verification of the entire flow:
    1.  Upload a work order -> Verify AI creates tasks.
    2.  Assign techs on detail page -> Verify they appear in task assignment dropdown.
    3.  Create/Manage tasks and checklists manually.
    4.  Create a template in Settings -> Apply to a task.
- Deployment to Vercel.ion
4. **Documentation Updates**
   - Updated `CONTEXT.md` with new components and features
   - Updated `PHASE_LOG.md` with Phase 5 completion
   - Comprehensive code cleanup

**Git Commit**: `feat: Add toast notifications, error boundaries, and documentation updates`

---

### Session 3 - December 11, 2024 (9:00 PM - 9:22 PM PST)

**Objective**: Implement Role-Based Access Control (RBAC) system with Super Admin role

**Changes Made**:

1. **Database Schema** (`database_migrations/003_rbac_schema.sql`)
   - Created `roles` table for role definitions
   - Created `permissions` table with 37 permissions across 10 resources
   - Created `role_permissions` junction table
   - Added `role_id` to `user_profiles` table
   - Seeded `super_admin` role with all permissions
   - Enabled RLS with appropriate policies

2. **TypeScript Types** (`types/rbac.ts`)
   - Created interfaces: Role, Permission, RoleWithPermissions, RoleInput
   - Created UserWithRole, PermissionGroup types
   - Permission action/resource union types

3. **Updated Supabase Types** (`types/supabase.ts`)
   - Added roles, permissions, role_permissions table types
   - Added role_id to user_profiles type

4. **RBAC Service** (`services/rbac.service.ts`)
   - Full CRUD for roles
   - Permission management functions
   - User permission queries
   - Role assignment to users
   - Grouped permissions by resource

5. **Permissions Hook** (`hooks/usePermissions.tsx`)
   - Created PermissionsProvider context
   - `usePermissions` hook for permission checks
   - `useHasPermission` utility hook
   - `RequirePermission` component for conditional rendering

6. **Admin UI**
   - `/dashboard/admin/roles/page.tsx` - Role management with permission checkboxes
   - `/dashboard/admin/users/page.tsx` - User role assignment table

7. **Layout Updates**
   - Updated Sidebar with Admin menu section
   - Wrapped dashboard layout with PermissionsProvider
   - Permission-based sidebar visibility

**Pending Actions**:
- [ ] Run `003_rbac_schema.sql` migration in Supabase Dashboard
- [ ] Assign Super Admin role to admin user
- [ ] Test role creation and permission assignment

**Git Commit**: `feat: Add role-based access control (RBAC) with Super Admin role`

---

### Session 4 - December 12, 2024 (4:43 AM - 5:28 AM PST)

**Objective**: Implement Admin Roles and Users Pages

**Changes Made**:
1.  **RBAC Management UI**
    -   Created Roles page (`/dashboard/admin/roles`) for managing role definitions and permissions.
    -   Created Users page (`/dashboard/admin/users`) for assigning roles to users.
    -   Implemented `usePermissions` hook improvements for cleaner access control.

2.  **Bug Fixes**
    -   Fixed role creation errors related to file path encoding.
    -   Resolved issues with role creation failing silently.

**Git Commit**: `feat: Add admin interface for roles and users`

---

### Session 5 - December 16, 2024 (2:43 PM - 3:10 PM PST)

**Objective**: Fix Sign-In Redirect Loop

**Changes Made**:
1.  **Authentication Fixes**
    -   Resolved `ERR_CONNECTION_REFUSED` error after Google sign-in.
    -   Fixed local environment variables affecting redirect URLs.
    -   Ensured proper redirection to dashboard after successful login.

**Git Commit**: `fix: Resolve sign-in redirect loop and environment issues`

---

### Session 6 - December 16, 2024 (3:38 PM - 8:02 PM PST)

**Objective**: Fix Build Errors and User Visibility

**Changes Made**:
1.  **Build Fixes**
    -   Resolved Vercel build error caused by missing `office_staff` Supabase type definitions.
    -   Updated `types/supabase.ts` to reflect the latest database schema.

2.  **User Visibility Policies**
    -   Fixed issue where Super Admins could not see newly created users.
    -   Created migration `008_fix_user_visibility.sql` adding `users:read` and `users:manage` policies for `user_profiles`.

3.  **Database Updates**
    -   Added `office_staff` table for directory management (`007_create_office_staff.sql`).
    -   Updated `vehicles` table with new columns: `make`, `driver`, `registration`, `gross_weight`, `vin` (`005_update_vehicles_schema.sql`).
    -   Seeded vehicle data (`006_seed_vehicles.sql`).
    -   Refactored `RBAC` policies for better manageability (`004_rbac_manage_policies.sql`).
    -   **Refactored Work Orders**: Moved to multi-file system with `work_order_files` table (`create_work_order_files.sql`).

**Git Commit**: `fix: Fix build errors, user visibility policies, and update vehicle schema`

---

### Session 7 - December 18, 2024 (8:30 AM - 9:15 AM PST)

**Objective**: Implement Phase 11 - Clients & Project Managers Module

**Changes Made**:
1.  **Database Schema** (`database_migrations/009_clients_and_pms.sql`)
    -   Created `clients` table for corporate entities (name, address, notes)
    -   Created `project_managers` table for client contacts (name, email, phone)
    -   Added `client_id` and `pm_id` columns to `work_orders` table
    -   Enabled RLS with permissive policies for new tables
    -   Created appropriate indexes for performance

2.  **TypeScript Types** (`types/database.ts`)
    -   Added `Client` interface with optional PM count and PM list
    -   Added `ProjectManager` interface with optional client reference
    -   Updated `WorkOrder` interface to include client assignment fields

3.  **Service Layer** (`services/clients.service.ts`)
    -   Full CRUD for clients
    -   Full CRUD for project managers
    -   Client search functionality
    -   PM search across all clients
    -   Work order assignment/unassignment

4.  **Forms** (`components/forms/`)
    -   Created `ClientForm.tsx` for adding/editing clients
    -   Created `ProjectManagerForm.tsx` for adding/editing client contacts

5.  **Clients Directory** (`app/dashboard/clients/page.tsx`)
    -   DataTable view of all clients
    -   Search functionality
    -   Add/Edit/Delete actions

6.  **Client Detail View** (`app/dashboard/clients/[id]/page.tsx`)
    -   Two-tab layout: Contacts and Work History
    -   Inline PM management (add/edit/delete)
    -   Work order history filtered by client

7.  **Work Orders Update** (`app/dashboard/work-orders/page.tsx`)
    -   Added "Link to Client" action for unassigned orders
    -   Added "Unlink" action for assigned orders
    -   Client assignment modal with cascading PM dropdown

8.  **Navigation** (`components/layout/Sidebar.tsx`)
    -   Added "Clients" item with 🏢 icon

9.  **Documentation**
    -   Updated `DATABASE_SCHEMA.md` with new tables and relationships

**Pending Actions**:
- [x] Run `009_clients_and_pms.sql` migration in Supabase Dashboard
- [x] Update Supabase types to include new tables
- [x] Verified client creation and PM (Client Contacts) functionality

**Git Commit**: `feat: Add Clients & Project Managers module (Phase 11)`

---

## How to Add New Sessions

When starting a new development session, add an entry following this format:

```markdown
### Session [N] - [Date] ([Time Range])

**Objective**: [Brief description of what you're working on]

**Changes Made**:
1. [Change 1]
2. [Change 2]
...

**Pending Actions**:
- [ ] [Action needed]

**Git Commit**: `[commit message]`

## Session: Enhancing Work Order System (Sub-Phase A)
**Date**: December 18, 2024
**Objective**: Implement advanced work order foundation, logistics, and work order numbering.

### Key Changes
1.  **Database Migration**: Created `database_migrations/010_advanced_wo_foundation.sql` to add:
    *   `work_order_number`, `site_address`, `planned_date`, `work_order_date` to `work_orders`.
    *   `job_types` table.
    *   `work_order_assignments` table (many-to-many technicians).
    *   `work_order_shipments` table with receipt photos.
2.  **Service Layer**:
    *   Updated `work-orders.service.ts` to handle new CRUD operations for job types, assignments, and shipments.
    *   Added `getReceiverOptions` for unified technician/staff dropdowns.
3.  **UI Components**:
    *   Created `components/work-orders/ShipmentManager.tsx` for tracking shipments and receipt uploads.
    *   Created `components/dashboard/RecentShipmentsWidget.tsx` for the main dashboard.
    *   Created `app/dashboard/work-orders/[id]/page.tsx` for the new advanced detail view.
    *   Updated `app/dashboard/work-orders/page.tsx` to display new columns and link to the detail page.
    *   Updated `app/dashboard/page.tsx` to include the `RecentShipmentsWidget`.
4.  **AI Integration**:
    *   Updated `app/api/process-work-order/route.ts` to extract `work_order_number`, `site_address`, and `work_order_date` from documents.

### Notes
*   **Action Required**: The user must run the `010_advanced_wo_foundation.sql` migration in Supabase SQL Editor.
*   **Action Required**: The user must create a new storage bucket named `shipment-photos` in Supabase with public read access.
```

## Session: Implementing Work Order Requirements UI
**Date**: December 18, 2024
**Objective**: Implement UI for managing work order requirements (skills, permits, equipment, materials).

### Key Changes
1.  **UI Components**:
    *   Created `components/ui/TagInput.tsx` for managing array-based text inputs (tags).
    *   Updated `components/ui/index.ts` to export `TagInput`.
2.  **Work Order Detail Page**:
    *   Updated `app/dashboard/work-orders/[id]/page.tsx` to include a new "Work Constraints & Requirements" section.
    *   Integrated `TagInput` to allow editing of `skills_required`, `permits_required`, `equipment_required`, and `materials_required`.
    *   Implemented view mode using `Badge` and list displays for these fields.
    *   Refactored the page structure to fix layout and TypeScript errors.
3.  **Database & Types**:
    *   Verified `database_migrations/011_wo_requirements.sql` (created in previous step).
    *   Verified `DATABASE_SCHEMA.md` updates.

### Notes
*   **Action Required**: Ensure `lucide-react` is installed (done automatically via `npm install`).

## December 18, 2024 (Session 3)
**Objective**: Finalize Work Order Assignments and Detail View enhancements

### Key Changes
1.  **Technician Assignments UI**:
    *   Implemented "View vs Edit" toggle for cleaner UI.
    *   Added **search functionality** to easily filter technicians by name/skills in edit mode.
2.  **Work Order Requirements**:
    *   Added `recommended_techs` (integer) field to `work_orders` table.
    *   Updated edit form to include input for recommended tech count.
    *   Updated view mode to display this recommendation.
3.  **Client & PM Visibility**:
    *   Updated `workOrdersService` to fetch nested `client` and `project_manager` data.
    *   Added display fields for Client and Project Manager in the Work Order Details card.
4.  **Error Handling**:
    *   Fixed AI processing 500 error by adding missing requirement columns to DB and sanitizing API inputs.

### Database Updates
*   Added `recommended_techs` column to `work_orders`.
*   Verified requirement columns (`skills_required`, etc.) exist.


## December 18, 2024 (Session 4)
**Objective**: Refactor Work Orders UI with Search, Filters, and improved layout.

### Key Changes
1.  **UI Refactoring**:
    *   Replaced the large "Upload Work Order" box with a clean **"+ Work Order" button** and modal.
    *   Simplified the table view to be the primary focus of the page.
2.  **Table Enhancements**:
    *   **Column Updates**:
        *   Added "Job Type" column.
        *   Updated dates to use `DD-MMM-YYYY` format (e.g., 18-Dec-2025).
        *   Displayed "Uploaded By" with actual user names (via new `getUserProfiles` service).
        *   Moved "Uploaded Date" to the far right.
        *   Removed "Actions" column for a cleaner look.
3.  **Search & Filtering**:
    *   Added a comprehensive **Filter Toolbar**:
        *   **Search**: Filters by WO#, Address, Client, Uploader.
        *   **Status**: specific Analyzed vs Pending checks.
        *   **Job Type**: dynamic dropdown.
        *   **Client**: dynamic dropdown.
        *   **Date**: specific upload date picker.
4.  **Technical**:
    *   Added `formatTableDate` utility.
    *   Optimized data fetching to load filter options (Clients, Job Types) on mount.

### Git Commit
`feat: Add Work Order search/filter and reorder columns`

## December 18, 2024 (Session 5)
**Objective**: Unify Admin Tools under "Settings" and add Job Types management.

### Key Changes
1.  **Navigation Restructure**:
    *   Renamed "Admin" section to **"Settings"** in the sidebar.
    *   Moved `Roles` and `Users` pages under `/dashboard/settings/`.
    *   Implemented a tabbed layout for improved navigation.
2.  **Job Types Management**:
    *   Added a new **"Job Types"** tab under Settings.
    *   Implemented full CRUD (Create, Edit, Delete) for job types.
    *   Added `updateJobType` to the service layer.
3.  **Code Maintenance**:
    *   Cleaned up folder structure by moving `app/dashboard/admin` to `app/dashboard/settings`.

### Git Commit
`feat: Refactor Admin to Settings tab and add Job Types management`

### Git Commit
`feat: Refactor Admin to Settings tab and add Job Types management`

## December 18, 2024 (Session 6)
**Objective**: Enhance Header with User Profile Dropdown.

### Key Changes
1.  **User Profile Component**:
    *   Created `UserProfile` component with Avatar, Name, and Dropdown menu.
    *   Implemented "Profile Settings" link and "Sign Out" functionality.
2.  **Logic Updates**:
    *   Updated `usePermissions` hook to fetch and expose full `user_profile` data (avatar, display name).
    *   Updated `Header` to use the new `UserProfile` component.
3.  **New Page**:
    *   Added `/dashboard/profile` page to view user account details.

### Git Commit
`feat: Implement User Profile dropdown and Profile Settings page`

## December 19, 2024 (Session 1)
**Objective**: Fix AI Work Order Prompt logic for better task extraction and field parsing.

### Key Changes
1.  **AI Prompt Update** (`app/api/process-work-order/route.ts`):
    *   Refined the prompt to ignore generic headers ("Installation", "Services") and extract specific actionable tasks.
    *   Added explicit extraction for `planned_date` and mapped it to the `work_orders` table update.
    *   Strengthened JSON formatting instructions to reduce parsing errors.
    *   Added a debug log to capture a sample of the raw AI response for troubleshooting.

2.  **Logic Enhancements**:
    *   Ensured `planned_date` is properly parsed and saved to the database.
    *   Directly mapped extracted `suggested_tasks` to the `work_order_tasks` table for immediate usability in the dashboard.

### Git Commit
`fix(work-orders): refine AI prompt logic for task extraction and date parsing`

## December 19, 2024 (Session 2)
**Objective**: Fix AI processing, migrate to Gemini, enhance Tasks UI, add File Viewer.

### Key Changes

#### 1. Database Migrations
*   Made migration files idempotent (safe to re-run) by adding `DROP POLICY IF EXISTS` and `CREATE INDEX IF NOT EXISTS`.
*   Affected files: `010_advanced_wo_foundation.sql`, `011_tasks_and_checklists.sql`.

#### 2. AI Provider Migration (OpenAI → Gemini 2.5 Pro)
*   Rewrote `app/api/process-work-order/route.ts` to use `@google/generative-ai`.
*   Configured model: `gemini-3-flash-preview` (changed from 2.5-pro due to overload).
*   Implemented native PDF and image support via `inlineData`.
*   Set `responseMimeType: 'application/json'` for reliable JSON output.
*   Added safety block to prevent hallucinations when no valid files are present.

#### 3. File Viewer Modal
*   Created `FileViewerModal.tsx` component for in-app PDF/image viewing.
*   Supports `<img>` for images, `<iframe>` for PDFs.
*   Added file navigation (arrows), download, and open-in-new-tab buttons.
*   Replaced "View Analysis" button with "View WO" on work order detail page.

#### 4. Task Description Display
*   Changed task description from `line-clamp-1` to `line-clamp-3` when collapsed.
*   Full description shown when task is expanded.

#### 5. Checklist Enhancements
*   Added `updateChecklistItem` service method.
*   Created `ChecklistItemRow` component with inline edit mode.
*   Made Edit (pencil) and Delete (trash) icons always visible.
*   Keyboard support: Enter to save, Escape to cancel edits.

#### 6. Edit Task Feature
*   Added "Edit Task" button next to "Delete Task".
*   Created Edit Task modal with Name, Description, Priority, Due Date fields.
*   Added `saveTaskEdit` function to update task via service.

#### 7. Tech Assignment Dropdown Improvements
*   Changed dropdown to open above (instead of below) to prevent cutoff.
*   Highlighted already-assigned techs with green background and checkmark.
*   Disabled re-selection of already-assigned techs.

### Git Commits (chronological)
1. `feat(work-orders): switch AI to Gemini 2.5 Pro with native PDF support`
2. `fix: correct Gemini model name to gemini-2.5-pro`
3. `fix: switch to gemini-3-flash-preview model`
4. `feat(work-orders): add in-app file viewer modal with View WO button`
5. `fix(tasks): show more of task description, full text when expanded`
6. `feat(tasks): add inline edit for checklist items with prominent icons`
7. `feat(tasks): add Edit Task button and modal`
8. `fix: TypeScript type error for priority field in edit task`
9. `fix: tech assign dropdown opens above to prevent cutoff`
10. `feat: highlight already-assigned techs in dropdown with green and checkmark`

---

### Session 11 - December 19, 2024 (11:05 AM - 11:35 AM PST)
**Focus**: Work Order Fields Enhancement - WO Owner, Shipment Status, and Job Status

#### Summary
Added three new fields to the work order module for better tracking and workflow management.

#### 1. Database Migration (`013_wo_additional_fields.sql`)
*   Added `owner_id` (UUID, FK to `user_profiles`) - WO Owner
*   Added `shipment_status` (TEXT) - Initial shipment/materials notes
*   Added `job_status` (TEXT) - Workflow status with CHECK constraint
*   Added `job_status_reason` (TEXT) - Reason required for On Hold/Cancelled
*   Created indexes for `job_status` and `owner_id`
*   Backfilled existing records: job_status = 'Open', owner_id = uploaded_by

#### 2. TypeScript Types Updated
*   Added `JobStatus` type: 'Open' | 'Active' | 'On Hold' | 'Completed' | 'Submitted' | 'Invoiced' | 'Cancelled'
*   Added `WorkOrderOwner` interface for joined owner profile
*   Extended `WorkOrder` interface with new fields
*   Updated `types/supabase.ts` with new columns and relationships

#### 3. Service Layer (`work-orders.service.ts`)
*   Updated `getAll()` to join owner profile
*   Updated `getById()` to include owner in select
*   Updated `create()` to set owner_id and default job_status
*   Added `updateJobStatus()` method with reason validation

#### 4. Upload Form Enhancement
*   Added "Initial Shipment Status" textarea field
*   Updated `onSubmit` signature to pass shipmentStatus
*   Auto-resets on successful upload

#### 5. Work Orders List Page
*   Added Job Status column with color-coded badges
*   Added Job Status filter dropdown
*   Updated `handleUpload` to pass owner_id and shipment_status

#### 6. Work Order Detail Page
*   Added WO Owner card in sidebar with avatar
*   Added Job Status dropdown in Quick Status section
*   Implemented Job Status change with reason modal for On Hold/Cancelled
*   Displays job_status_reason when applicable

### Job Status Color Scheme
| Status | Color |
|--------|-------|
| Open | Blue |
| Active | Green |
| On Hold | Yellow |
| Completed | Purple |
| Submitted | Indigo |
| Invoiced | Emerald |
| Cancelled | Red |

### Files Modified
- `database_migrations/013_wo_additional_fields.sql` (new)
- `types/database.ts`
- `types/supabase.ts`
- `services/work-orders.service.ts`
- `components/work-orders/WorkOrderUploadForm.tsx`
- `app/dashboard/work-orders/page.tsx`
- `app/dashboard/work-orders/[id]/page.tsx`
- `app/dashboard/work-orders/[id]/page.tsx`
- `DATABASE_SCHEMA.md`

#### 7. Shipping Comments Feature (11:45 AM - 12:05 PM PST)
Transformed `shipment_status` from a simple text field to a threaded comment system.

*   **Database Migration (`014_shipping_comments.sql`)**:
    *   Created `work_order_shipping_comments` table with `work_order_id`, `user_id`, `content`.
    *   Enabled RLS: Users can only edit/delete their own comments.
    *   Added indexes for performance.
*   **Service Layer**: Added `getShippingComments`, `addShippingComment`, `updateShippingComment`, `deleteShippingComment`.
*   **UI Components**:
    *   Created `ShippingComments` component:
        *   Displays comments (newest first) with user avatars and timestamps.
        *   Supports inline editing and deleting (for own comments).
    *   Integrated into `WorkOrderDetailPage`:
        *   Moved "Shipments" section back to the main left column.
        *   Combined "Shipping Comments" and "Shipment Tracker" into a single "Shipments & Tracking" card.
    *   Updated `WorkOrderUploadForm`:
        *   Renamed "Initial Shipment Status" to "Initial Shipping Comment".
        *   Creates the first comment automatically upon upload.

#### 8. Work Order Upload Flow Refactor (12:30 PM - 1:00 PM PST)
Refactored the work order upload process into a two-step "Upload -> Analyze -> Review" workflow.

*   **New Flow**:
    1.  **Upload Modal**: User uploads files (no extra fields).
    2.  **Processing**: Work order is created in DB, files uploaded, AI analysis runs.
    3.  **Review Modal (New)**: automatically opens after analysis.
        *   User reviews AI-extracted data.
        *   Pre-fills "Site Address" from AI.
        *   Provides AI recommendations for "Client" and "Job Type".
        *   Allows choosing "Work Order Owner" and "Project Manager".
        *   Initial "Shipping Comment" entry moved to this step.
*   **Components**:
    *   **New**: `WorkOrderReviewModal.tsx` handles the review/edit/save logic.
    *   **Updated**: `WorkOrderUploadForm.tsx` (removed shipping comment field).
    *   **Updated**: `WorkOrdersPage` manages the state transition between Upload and Review modals.
*   **Result**: Users have a mandatory review step to verify AI data before considering the WO completely "setup", but the data is safely in the DB immediately after upload.

---

### Session 11 Summary
**Duration**: ~3 hours  
**Focus**: Shipping Comments System & Work Order Upload Flow Refactor

#### Key Deliverables
1. **Shipping Comments** - Full threaded comment system for shipping conversations
2. **Two-Step Upload Flow** - Upload → AI Analyze → Review Modal workflow
3. **AI Recommendations** - Auto-match Client and Job Type from AI extraction
4. **WorkOrderReviewModal** - New component for post-upload data enrichment

#### Database Migrations Required
⚠️ **Run these in Supabase SQL Editor if not already done:**
- `013_wo_additional_fields.sql` - WO Owner, Job Status fields
- `014_shipping_comments.sql` - Shipping comments table

#### Files Changed
- 8 new/modified components
- 2 database migrations
- Service layer updates
- Documentation updates

**Commit History:**
- `feat(work-orders): refactor upload flow to include post-analysis review step`
- `docs: update SESSION-LOG.md with upload flow refactor details`
- `chore: remove unused import`

---

### Session 12 - December 19, 2024 (2:00 PM - 6:25 PM PST)

**Objective**: Implement Task Comments System and Task Categories/Tags

#### Phase 16: Task Comments System

##### A. Database Schema
- **Created `work_order_task_comments` table**
  - Threaded comments on individual tasks
  - Text content with attachments (max 5 files)
  - `updated_at` for edit tracking
  
- **Created `task_comment_mentions` table**
  - Junction table for @mentions
  - Supports both user_profiles and technicians
  - For future notification system

##### B. Service Layer
- `getTaskComments(taskId)` - Fetch comments with user profiles and mentions
- `getTaskCommentCount(taskId)` - Count for badge display
- `addTaskComment(...)` - Create with attachments and mentions
- `updateTaskComment(...)` - Edit own comments
- `deleteTaskComment(commentId)` - Delete own comments
- `getMentionableUsers(workOrderId)` - Office staff + WO technicians + WO owner
- `uploadCommentAttachment(taskId, file)` - 25MB limit, PDF/images only

##### C. UI Components
- **TaskCommentsPanel** - Slide-out panel for task comments
  - @mention dropdown with type-ahead filtering
  - File attachment with image thumbnails (96×96px)
  - PDF file cards with icon display
  - Edit/delete own comments with "(edited)" indicator
  - FileViewerModal integration for attachment preview
  - Comment count badge on task cards

#### Phase 17: Task Categories and Tags

##### A. Database Schema
- **Created `work_order_categories` table**
  - Categories scoped to each work order (WO-specific)
  - Single category per task
  - Color support for visual distinction
  - Unique constraint on (work_order_id, name)

- **Created `task_tags` table**
  - Global tags shared across all work orders
  - Multi-select per task
  - Color support
  - Unique name constraint

- **Created `task_tag_assignments` junction table**
  - Many-to-many relationship between tasks and tags

- **Added `category_id` to `work_order_tasks`**

##### B. Service Layer
- Category CRUD: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- Tag CRUD: `getAllTags`, `createTag`, `updateTag`, `deleteTag`
- Task assignments: `getTaskTags`, `assignTagsToTask`, `setTaskCategory`

##### C. UI Components
- **CategorySelector** - Dropdown with inline creation and color picker
- **TagSelector** - Multi-select with search, inline creation, color picker
- Updated **WorkOrderTasks** to display category badge and tag pills
- Added selectors to both Create Task and Edit Task modals

#### Database Migrations Required
⚠️ **Run these in Supabase SQL Editor:**
- `015_task_comments.sql` - Task comments and mentions tables
- `016_task_categories_and_tags.sql` - Categories, tags, and assignments tables

#### Files Created/Modified
| File | Change |
|------|--------|
| `database_migrations/015_task_comments.sql` | New |
| `database_migrations/016_task_categories_and_tags.sql` | New |
| `types/database.ts` | Added interfaces |
| `types/supabase.ts` | Added table types |
| `services/work-orders.service.ts` | Added 15+ methods |
| `components/work-orders/TaskCommentsPanel.tsx` | New |
| `components/work-orders/CategorySelector.tsx` | New |
| `components/work-orders/TagSelector.tsx` | New |
| `components/work-orders/WorkOrderTasks.tsx` | Updated |
| `components/work-orders/index.ts` | Added exports |
| `DATABASE_SCHEMA.md` | Phase 16 & 17 docs |

#### Commit History
- `feat: Implement task comments system with @mentions and attachments`
- `feat: Add image thumbnail previews for comment attachments`
- `fix: Improve @mention dropdown positioning and styling`
- `feat: Change comment order to oldest first (chronological)`


- `feat: Add task categories (WO-scoped) and global tags`
- `feat: Add category and tag selectors to Create Task modal`

---

### Session 12 Summary
**Duration**: ~4.5 hours  
**Focus**: Task Comments, Categories, and Tags

#### Key Deliverables
1. **Task Comments** - Threaded comments with @mentions and file attachments
2. **Task Categories** - WO-scoped categorization with colors
3. **Task Tags** - Global tagging system with multi-select
4. **Enhanced UI** - Thumbnails, dropdowns, inline creation

#### Pending for Future Sessions
- Settings page for global tag management (admin CRUD)
- Notification system for @mentions
- Reporting/filtering by category and tags

---

### Session 13 - December 20, 2024 (Time: N/A)

**Objective**: Implement Work Order File Categorization System

**Changes Made**:

#### 1. Database Schema (`database_migrations/017_file_categories_schema.sql`)
- Created `file_categories` table for hierarchical file organization.
  - Supports system vs custom categories.
  - Supports parent-child relationship (infinite nesting possible, UI optimized for 2 levels).
  - RBAC levels: `office`, `field`, `office_only`.
- Updated `work_order_files` table:
  - Added `category_id` FK.
  - Added `uploaded_by` FK (previously just text/missing link).

#### 2. Service Layer Updates (`services/work-orders.service.ts`)
- Added methods for category management:
  - `initializeSystemCategories`: Creates default structure (Work Order, Survey, Plans, Art Work, Pictures/Before/After/etc., Tech Docs, Office Docs).
  - `getFileCategories`: Fetches categories with nested files.
  - `createFileCategory`, `deleteFileCategory`.
- Added/Updated file methods:
  - `uploadFileToCategory`: Uploads to specific category and organized storage path.
  - `recategorizeFile`: Move files between categories.
  - `deleteFile`: Handles storage and DB deletion.

#### 3. UI Implementation
- **WorkOrderUploadForm Redesign**:
  - Structured upload experience matching system categories.
  - Support for creating custom categories on the fly.
  - Foldable sections for clarity.
  - "Work Order" category mandatory.
- **WorkOrderFilesCard (New)**:
  - Located on Work Order Detail page (Left Column).
  - Categorized file viewer with hierarchical accordion layout.
  - Actions: Upload new file to category, View file, Move file (recategorize), Delete file.
  - RBAC-aware UI (simplified check).
- **Details Page Integration**:
  - Removed "View Files" button (modal) in favor of inline Card.
  - Kept "View WO" file viewer for quick PDF access.

#### 4. Workflow Updates
- **Upload Flow**:
  1. User categorizes files in Upload Form.
  2. Categories created/initialized on submit.
  3. Files uploaded to specific category paths.
  4. AI analysis runs on the Work Order.

**Pending Actions**:
- [ ] Run `017_file_categories_schema.sql` migration in Supabase.
- [ ] Verify RBAC enforcement in RLS policies (applied in migration).

**Git Commit**: `feat: Implement file categorization system with hierarchical folders and RBAC`

### Session 13 Update: UI Fixes (Work Order Upload)
**Changes Made**:
- **Fixed UI Clipping**: Constrained `WorkOrderUploadForm` height (`h-[65vh]`) to ensure the footer buttons are always visible.
- **Workflow Clarity**:
  - Renamed submit button to "Submit Work Order".
  - Updated loading state text to "Submitting and Starting AI Analysis..." to better reflect the process.
  - Fixed "Cancel" button functionality.

**Git Commit**: `fix: Prevent upload form UI clipping and improve workflow clarity`

### Session 13 Update: Layout Refactor (Upload Modal)
**Changes Made**:
- **Native Modal Footer**: Moved action buttons (Submit, Cancel) to the Modal's `footer` prop.
- **Improved Scrolling**: Removed fixed height from the form, allowing the content to scroll naturally within the modal body while buttons remain fixed at the bottom.
- **Cleaned Up**: Removed redundant "Close" button configurations.

**Git Commit**: `fix: Refactor upload modal layout to use native footer for better scrolling`

### Session 13 Update: Form Submission Bug Fix
**Changes Made**:
- **Bug**: Clicking "+ Add File" or other buttons inside the form was accidentally submitting the form and triggering AI analysis prematurely.
- **Root Cause**: HTML buttons without a `type` attribute default to `type="submit"` when inside a `<form>`.
- **Fix**: Added `type="button"` to all buttons inside `WorkOrderUploadForm`:
  - "+ Add File" buttons (for each category)
  - "Add" button (for custom category creation)
  - "Cancel" button (for custom category input)
- **Additional Fix**: Wrapped the upload Modal in a conditional render to ensure the form state resets when the modal closes.

**Git Commit**: `fix: Prevent accidental form submission when adding files`

### Session 13 Update: AI Processing Path Fix
**Changes Made**:
- **Bug**: AI processing failed with "StorageUnknownError" - 400 Bad Request when trying to download files.
- **Root Cause**: The `process-work-order` API route was extracting only the filename from the storage URL, but the new category-based storage structure saves files at `{workOrderId}/{categorySlug}/{timestamp}_{filename}`.
- **Fix**: Updated file path extraction in `/app/api/process-work-order/route.ts` to correctly parse the full path after the bucket name (`/work-orders/`).

**Git Commit**: `fix: Correct file path extraction for AI processing with new category paths`

---

## Session Summary (Dec 19, 2024)
**Total Commits**: 5
1. `feat: Implement file categorization system with hierarchical folders and RBAC`
2. `fix: Prevent upload form UI clipping and improve workflow clarity`
3. `fix: Refactor upload modal layout to use native footer for better scrolling`
4. `fix: Prevent accidental form submission when adding files`
5. `fix: Correct file path extraction for AI processing with new category paths`

**Key Features Delivered**:
- File Categorization System with hierarchical folders
- System categories (Work Order, Survey, Plans, Pictures, etc.)
- Custom category support during upload
- RBAC-aware file management

**Bugs Fixed**:
- Upload modal UI clipping and scrolling issues
- Accidental form submission when adding files
- AI processing path mismatch with new storage structure


### Session 23 - December 22, 2024 (Logistics & Scheduling)

**Objective**: Implement work order scheduling fields, review workflow, and multi-date support.

**Changes Made**:

1.  **Database Migration (`018_wo_scheduling_fields.sql`)**:
    *   Added `estimated_days` (integer) for job duration.
    *   Added `scheduling_notes` (text) for special requirements.
    *   Added `review_needed` (boolean, default true) flag.
    *   Replaced `planned_date` with `planned_dates` (date array) for multi-day jobs.

2.  **UI Updates**:
    *   **WorkOrderReviewModal**: Added inputs for new fields and multi-date picker.
    *   **WorkOrderEditModal**: Synced with new scheduling fields.
    *   **WorkOrderDetailHeader**:
        *   Added "Review Needed" badge with popover listing missing critical info (Client, PM, Owner).
        *   Updated schedule section to display multiple planned dates.

3.  **API & Services**:
    *   Updated `workOrdersService` to handle new fields and array transformations.
    *   Updated `/api/process-work-order` to extract `planned_dates` as an array from AI analysis.

4.  **Refactoring**:
    *   Cleaned up `planned_date` usage across the codebase.
    *   Improved type definitions in `types/database.ts`.

**Git Commit**: `feat: Add WO scheduling fields - estimated_days, scheduling_notes, planned_dates array, review needed badge`

---

### Session 24 - December 22, 2024 (Invitation System & Auth Fix)

**Objective**: Fix authentication lockout and implement proper invitation-based user registration.

**Problem Encountered**:
- RLS policies on `user_profiles` caused infinite recursion error
- FK constraint between `user_profiles.id` and `auth.users.id` prevented admin creation of profiles for new users
- User was locked out due to aggressive unauthorized redirects in auth callback and middleware

**Solution Implemented**:

1.  **Created `invitations` Table** (`database_migrations/021_invitations_table.sql`):
    - Stores pre-registered user data (email, name, role, type settings)
    - Admins invite users; users claim their invitation on first sign-in

2.  **Rewrote Auth Flow** (`app/auth/callback/route.ts`):
    - Uses service role client to bypass RLS
    - Checks for existing profile by auth ID first
    - Checks `invitations` table for new users
    - Creates profile + extension records on invitation claim
    - Redirects to `/unauthorized` if no invitation exists

3.  **Simplified Middleware** (`lib/supabase/middleware.ts`):
    - Removed aggressive profile checks that caused lockout
    - Simple onboarding redirect logic

4.  **Fixed RLS Policies**:
    - Removed recursive admin check in `user_profiles` policies
    - Simple policies: authenticated can read, users manage own profile

5.  **Updated User Management** (`app/dashboard/settings/users/page.tsx`):
    - Tabbed interface: Active Users | Pending Invitations
    - Invite User button creates invitation
    - Edit button opens EditUserModal for existing users
    - Revoke action for pending invitations

6.  **Created EditUserModal** (`components/settings/EditUserModal.tsx`):
    - Edit display name, nick name, phone number
    - Change RBAC role
    - Toggle Technician/Office Staff types with skills/title
    - Archive/Restore users

7.  **Updated Types** (`types/supabase.ts`):
    - Added `invitations` table type definition

**Git Commits**:
- `EMERGENCY: Revert to simple auth callback - disable guest list`
- `EMERGENCY: Revert middleware - remove unauthorized redirects`
- `feat: Implement invitation system for user pre-registration`
- `feat: Add Edit User modal for role and type management`
- `feat: Add phone number field to Edit User modal`

---

### Session 25 - December 22, 2024 (1:45 PM PST)

**Objective**: Implement dedicated Client Login Page with email/password authentication.

**Changes Made**:

1.  **Created Client Login Page** (`app/client-login/page.tsx`):
    - Email/password login form with professional dark theme design
    - Uses `supabase.auth.signInWithPassword()` for authentication
    - Validates user has `'client'` in `user_types` array
    - Error handling: Invalid credentials, account not found, deactivated account, non-client access
    - Signs out unauthorized users immediately

2.  **Created Client Dashboard** (`app/client-dashboard/page.tsx`):
    - Placeholder dashboard with dark glassmorphism design
    - Welcome header with user name and sign-out functionality
    - Three placeholder cards: Active Projects, Documents, Messages
    - Contact info section for support

3.  **Updated Middleware** (`lib/supabase/middleware.ts`):
    - Added `/client-login` page handling (allows unauthenticated access)
    - Added `/client-dashboard` route protection:
        - Requires authentication
        - Validates `user_types` includes `'client'`
        - Validates account is active (`is_active: true`)
    - Redirects authenticated clients away from `/client-login` → `/client-dashboard`
    - Non-client users accessing client dashboard are signed out

**Architecture**:
- Internal team: Uses Google OAuth at `/login` → `/dashboard`
- External clients: Uses email/password at `/client-login` → `/client-dashboard`
- Client accounts must be manually created with `user_types: ['client']` and password set in Supabase

**Git Commit**: `feat: Add dedicated client login page with email/password auth`

---

### Session 25 (Continued) - December 22, 2024 (2:00 PM PST)

**Objective**: Add Admin UI for creating client portal accounts for Project Managers.

**Clarification**: Client logins are for **Project Managers** (client contacts), not the `clients` table (corporate entities).

**Changes Made**:

1.  **Database Migration** (`database_migrations/022_project_manager_auth.sql`):
    - Added `user_profile_id` column to `project_managers` table
    - Created index for efficient lookups

2.  **Server Action** (`app/actions/client-accounts.ts`):
    - `createClientAccount()`: Creates auth user + user_profile with `user_types: ['client']`
    - `generateSecurePassword()`: Auto-generates secure 10-char password
    - Links PM to user_profile via `projectManagerId` parameter

3.  **New Component** (`components/clients/CreatePortalAccountModal.tsx`):
    - Password input with "Generate" button
    - Shows credentials summary after creation
    - Copy-to-clipboard functionality for email/password

4.  **Updated Client Detail Page** (`app/dashboard/clients/[id]/page.tsx`):
    - Added "Portal Access" column with status badge
    - Added "Create Portal" button for PMs without portal access
    - Integrated CreatePortalAccountModal

5.  **Updated Type** (`types/database.ts`):
    - Added `user_profile_id?: string | null` to ProjectManager interface

**Git Commit**: `feat: Add admin UI for creating client portal accounts`

---

### Session 26 - December 22, 2024 (3:15 PM PST)

**Objective**: Migrate work order assignments, task assignments, and task comment mentions to use unified `user_profile_id` instead of legacy `technician_id`.

**Changes Made**:

1.  **Database Migration** (`database_migrations/023_assignment_user_profile_fk.sql`):
    -   Added `user_profile_id` to `work_order_assignments` and `task_assignments`.
    -   Migrated existing data from `technician_id` to `user_profile_id`.
    -   Migrated `task_comment_mentions` to use `mentioned_user_id` only.
    -   Dropped legacy `technician_id` and `mentioned_technician_id` columns.
    -   Added appropriate constraints and indexes.

2.  **Service Layer Refactoring** (`services/work-orders.service.ts`):
    -   `assignTechnicians` and `assignTask` now use `user_profile_id`.
    -   `getAssignments` queries join `user_profiles` instead of `technicians`.
    -   Mentions logic consolidated to `mentionedUserIds` (removed technician distinction).

3.  **UI Updates**:
    -   Updated `WorkOrderTasks.tsx` to handle assignments via user profiles.
    -   Updated `TaskCommentsPanel.tsx` to use unified mention logic.
    -   Updated Work Order Detail pages (v1 and v2) to track assignments by `user_profile_id`.

4.  **Type Definitions**:
    -   Updated `types/database.ts` and `types/supabase.ts` to reflect schema changes.

**Pending Actions**:
- [ ] Run `023_assignment_user_profile_fk.sql` migration in Supabase Dashboard.

**Git Commit**: `feat: migrate assignments and mentions to unified user identity (user_profile_id)`

---

### Session 27 - December 23, 2024 (8:00 AM PST)

**Objective**: Implement Team Tab with roster and real-time chat for Work Order detail pages.

**Changes Made**:

1.  **Database Migration** (`database_migrations/024_work_order_team.sql`):
    -   Created `work_order_team` table for office staff assignments
    -   Links `work_order_id` to `user_profile_id`
    -   RLS policies for authenticated CRUD

2.  **Database Migration** (`database_migrations/025_work_order_chat.sql`):
    -   Created `work_order_chat_messages` table for team chat
    -   Fields: `id`, `work_order_id`, `user_profile_id`, `message` (2000 char max), `file_references` (UUID[]), `edited_at`, `is_deleted`, `created_at`
    -   RLS policies: only team members (owner, office staff, technicians) can view/send messages
    -   Enabled Supabase Realtime for live updates
    -   Helper function `is_work_order_team_member()` for access checks

3.  **Service Layer** (`services/work-orders.service.ts`):
    -   Added `getOfficeStaffUsers()`: Fetches active office staff
    -   Added `addTeamMembers()`: Adds office staff to WO team
    -   Added `removeTeamMember()`: Removes office staff from team
    -   Added `getTeamMembers()`: Gets team members for a WO
    -   Added `getFullTeamRoster()`: Gets owner, office staff, technicians
    -   Added `getChatMessages()`: Fetches chat messages
    -   Added `sendChatMessage()`: Sends new message with file refs
    -   Added `editChatMessage()`: Edits own message (sets edited_at)
    -   Added `deleteChatMessage()`: Soft deletes message
    -   Added `isTeamMember()`: Checks if user is on the team

4.  **UI Components** (`components/work-orders/team/`):
    -   `WorkOrderTeamTab.tsx`: Main container with access control
    -   `TeamRoster.tsx`: Shows WO Owner, Office Staff (editable), Technicians
    -   `TeamChat.tsx`: Real-time chat with Supabase Realtime subscription
    -   `ChatMessage.tsx`: Message display with hover edit/delete menu
    -   `ChatInput.tsx`: Message input with file attachment modal (grouped by category)

5.  **Work Order Review Modal** (`components/work-orders/WorkOrderReviewModal.tsx`):
    -   Added inline team selection during WO creation
    -   Chip selector for office staff
    -   Saves team members on "Confirm & Save"

6.  **WO Detail Pages**:
    -   Added Team section to v1 page (`app/dashboard/work-orders/[id]/page.tsx`)
    -   Added "Team" tab to v2 beta page (`app/dashboard/work-orders-v2/[id]/page.tsx`)

**Pending Actions**:
- [ ] Run `024_work_order_team.sql` migration in Supabase Dashboard
- [ ] Run `025_work_order_chat.sql` migration in Supabase Dashboard

**Git Commits**:
- `feat: integrate team selection into review modal, remove Step 3`
- `feat: add Team tab with roster and real-time chat for WO detail page`
- `feat: add Team tab to work-orders-v2 detail page`

---

### Session 13 - December 23, 2024 (10:00 AM - 11:30 AM PST)

**Objective**: User Type Simplification & Legacy Code Removal

**Changes Made**:

1.  **User Type Migration**
    *   Simplified data model: Replaced array-based `user_types` with single `user_type` column (`'internal' | 'external'`).
    *   **Migrations**:
        *   `026_user_type_simplification.sql`: Schema changes and data migration.
        *   `027_migrate_office_staff_data.sql`: Migrated titles and dropped `office_staff` table.
        *   `028_secure_rls_with_user_type.sql`: Updated RLS to use `is_internal()` check.
    *   **Cleanup**: Removed `office_staff` table and related legacy code.

2.  **Code Refactoring**
    *   **Service Layer**:
        *   Updated `users.service.ts` to filter technicians from office staff queries.
        *   Refactored `work-orders.service.ts` to remove all `OfficeStaff` type references and queries.
    *   **UI Components**:
        *   Refactored `UserFormModal` (Invite User) to use a **User Type Dropdown** instead of checkboxes.
        *   Updated `OfficeStaffTab` to correctly display internal staff without technician duplicates.

3.  **Build Fixes**
    *   Resolved Vercel build errors caused by linger references to the deleted `OfficeStaff` type in `work-orders.service.ts`.
    *   Fixed duplicate import syntax errors.

4.  **Verification**
    *   Performed global codebase scan to ensure 0 remaining broken `OfficeStaff` imports.
    *   Verified UI for user invitation and directory listings.

**Git Commit**: `refactor: Complete user type migration, UI updates, and build fixes`

# December 23, 2024 (Session 2)

## Redesign People Directory

### Objectives
- Unify the "Technicians" and "Office Staff" tabs into a single **People** directory table.
- Implement **Role-Based Filtering** using dynamic chips from the `roles` table.
- Ensure only **Internal** users and roles are displayed (security/privacy).

### Actions Taken
1.  **UI Redesign**
    - Created `components/people/PeopleTable.tsx`: A unified data table component fetching all users and roles.
    - Replaced `app/dashboard/people/page.tsx` content to use the new `PeopleTable` instead of the tabbed layout.
    - Removed deprecated components: `TechniciansTab.tsx` and `OfficeStaffTab.tsx`.

2.  **Filtering Logic**
    - Implemented client-side filtering to strictly show users where `user_type === 'internal'`.
    - Implemented role chip filtering to strictly show roles where `user_type === 'internal'` (filtering out Client, Vendor, Sub-contractor roles).
    - Added text search functionality for name/email.
    - Added dynamic role chips (All, Admin, Technician, etc.) that filter the table view instantly.

3.  **Refactoring & Cleanup**
    - Fixed linting errors in `PeopleTable.tsx`.
    - Updated `useAsync` hook usage to correctly trigger data fetching via `useEffect`.

### Outcome
- The `/dashboard/people` page now displays a clean, single list of all internal staff.
- Users can easily filter by role without navigating between tabs.
- External users (Clients) are securely hidden from this view.

**Git Commit**: `feat: Redesign People page with unified table and role-based filters`

---

### Session 14 - December 23, 2024 (11:30 AM - 12:40 PM PST)

**Objective**: Role-Based User Type Simplification & Onboarding Improvements

**Changes Made**:

#### 1. User Type Now Derived from Role
- **Core Change**: `user_type` (`internal`/`external`) is now solely determined by the `roles.user_type` column.
- **Removed Legacy UI**:
  - Removed "User Type" dropdown from `InviteUserModal` (was technician/office_staff).
  - Removed "User Types" checkboxes from `EditUserModal`.
  - Removed "TYPES" column from Settings Users table.
  - Skills section now only shows when RBAC role is "Technician".

#### 2. Roles Management Updates
- Added **User Type** (Internal/External) radio buttons to Role Create/Edit modals.
- Role cards now display a badge showing Internal or External.
- Updated `RoleInput` type and `createRole`/`updateRole` service functions.

#### 3. Auth Callback Fix
- **Bug**: `user_type` was hardcoded to `'internal'` when creating profiles during OAuth callback.
- **Fix**: Auth callback now fetches `role.user_type` from the invitation and uses it.

#### 4. Onboarding Simplification
- **Reduced from 3 steps to 2 steps**:
  - Step 1: Avatar (editable), Nick Name (editable), Phone (editable), Name (read-only)
  - Step 2: Review showing all info including assigned RBAC Role
- **Removed editable name** - Now locked to what admin set in invitation.
- **Shows assigned role** - No more "Your role will be assigned by an administrator" message.

#### 5. User Role Update Bug Fix
- **Bug**: Editing a user's role didn't persist (`role_id` was missing from update query).
- **Fix**: Added `role_id` to `updateData` in `users.service.ts`.

**Files Modified**:
- `types/rbac.ts` - Added `user_type` to `RoleInput`
- `services/rbac.service.ts` - `createRole` includes `user_type`
- `services/users.service.ts` - Fixed `role_id` in `updateUser`, removed `is_office_staff`
- `components/settings/UserFormModal.tsx` - Role required, grouped by user_type
- `components/settings/EditUserModal.tsx` - Removed user type checkboxes
- `app/dashboard/settings/roles/page.tsx` - User Type selector and badge
- `app/dashboard/settings/users/page.tsx` - Removed TYPES column
- `app/auth/callback/route.ts` - Derives user_type from role
- `app/onboarding/page.tsx` - Complete rewrite for 2-step flow

**Git Commits**:
- `refactor: simplify user type to role-based system`
- `fix: auth callback derives user_type from role`
- `feat: simplify onboarding to 2-step flow`
- `fix: user role updates now save correctly`

---

### Session 15 - December 23, 2024 (1:30 PM - 2:25 PM PST)

**Objective**: Implement Company Settings and Client Hub Features

**Changes Made**:

#### 1. Company Settings (Phase A)
- **Database**: Created `company_settings` table with single-row constraint
  - Fields: name, logo_url, phone, email, website, full address, tax_id
  - Added `settings:manage_company` permission
- **Storage**: `company-assets` bucket for logo uploads
- **Service**: `company-settings.service.ts` with CRUD + logo management
- **UI**: Company Info settings page at `/dashboard/settings/company`
  - Logo upload with preview and delete
  - All company fields editable
  - Permission-controlled

#### 2. Client Hub (Phase B)
- **Database Migration** (`030_client_hub_schema.sql`):
  - `can_access_client_hub()` SQL function for unified access control
  - `work_order_client_access` table (additional client contacts)
  - `work_order_client_chat` table (client-facing chat with real-time)
  - RLS policies using the helper function
  - `client_hub:manage_contacts` permission

- **Service Layer** (`work-orders.service.ts`):
  - `getClientHubContacts()` - Primary PM + additional contacts
  - `addClientContact()` / `removeClientContact()` - Manage contacts
  - `getClientChatMessages()` - Chat history
  - `sendClientChatMessage()` - Auto-detects sender company name
  - `editClientChatMessage()` / `deleteClientChatMessage()`
  - `uploadClientChatAttachment()` - File uploads to `client-uploads/`
  - `canAccessClientHub()` - Client-side access check

- **UI Components** (`components/work-orders/client-hub/`):
  - `ClientHubTab.tsx` - Main tab with access control states
  - `ContactHierarchy.tsx` - Primary PM + additional contacts display
  - `ClientChat.tsx` - Real-time chat with purple accent theme

- **Integration**:
  - Added Client Hub section to Work Order detail page (legacy)
  - Added Client Hub tab to Work Orders v2 (beta) page
  - Purple styling for visual differentiation from Team Chat

**Design Decisions**:
- Separate chats: Team Chat (internal blue) vs Client Hub (external purple)
- Technicians cannot access Client Hub
- Sender shows "(Company Name)" for internal, "(Client Name)" for external
- PMs without portal accounts show "No Portal Access" badge
- Additional contacts limited to PMs from same client

**Files Created/Modified**:
| File | Change |
|------|--------|
| `database_migrations/029_company_settings.sql` | Company settings table |
| `database_migrations/030_client_hub_schema.sql` | Client Hub tables |
| `services/company-settings.service.ts` | Company settings CRUD |
| `services/work-orders.service.ts` | 10+ Client Hub methods |
| `types/supabase.ts` | New table types |
| `components/work-orders/client-hub/*` | 3 new components |
| `app/dashboard/settings/company/page.tsx` | Company Info page |
| `app/dashboard/work-orders/[id]/page.tsx` | Client Hub integration |
| `app/dashboard/work-orders-v2/[id]/page.tsx` | Client Hub tab |

**Git Commits**:
- `feat: add company settings table and service`
- `feat: create Company Info settings page`
- `fix: correct permissions column names in company settings migration`
- `feat: implement Client Hub - database migration, service layer, and UI components`
- `feat: integrate Client Hub tab into Work Order detail page`
- `feat: add Client Hub tab to Work Orders v2 beta page`


## Session 16: Client Portal Implementation
**Date**: December 23-24, 2024

### Objectives
1. Design and implement the client-facing portal view
2. Add file visibility control for client access
3. Implement chat export to PDF
4. Create internal UI for managing file visibility

### Planning Discussion
- Reviewed existing `/client-dashboard` placeholder
- Discussed file visibility approaches:
  - Option A: All files visible
  - Option B: Category-based visibility
  - **Option C (Selected)**: Explicit `is_client_visible` flag per file
- Decided on PDF-only export with company branding

### Implementation Summary

#### 1. Database Migration (`031_client_portal_files.sql`)
- Added `is_client_visible BOOLEAN DEFAULT FALSE` to `work_order_files`
- Created partial index for efficient filtering
- Migration applied via Supabase MCP tool

#### 2. Client Portal Service (`services/client-portal.service.ts`)
New service with 7 methods:
- `getCurrentProjectManager()` - Get current user's PM record
- `getAccessibleWorkOrders()` - WOs where user is primary/additional PM
- `getWorkOrderForClient()` - WO details with owner contact
- `getClientVisibleFiles()` - Files with `is_client_visible = true`
- `getChatMessagesForExport()` - Formatted messages for PDF
- `getCompanySettings()` - Company branding
- `canAccessWorkOrder()` - Access validation

#### 3. Work Orders Service Updates
Added 2 methods:
- `getFilesWithVisibility()` - Split files by visibility status
- `toggleFileClientVisibility()` - Toggle flag on/off

#### 4. Client Portal UI (`app/client-dashboard/page.tsx`)
Complete redesign with:
- **Header**: Company logo + name, client info, sign out
- **WO Selector**: Dropdown with accessible work orders
- **Detail View**: WO#, status, PO, address, owner contact
- **Tabs**: Chat (real-time + export), Files (download), Reports (placeholder)
- **PDF Export**: jsPDF library, includes all header info + chat

#### 5. Internal File Manager (`ClientFilesManager.tsx`)
New component for Client Hub tab:
- Shows shared files with green checkmark badges
- Collapsible "Share More Files" section
- One-click toggle with loading states
- Thumbnail previews for images, icons for PDFs/docs

### Bug Fixes
- **Table Name Error**: Fixed `work_order_file_categories` → `file_categories` in both services

### Files Created
| File | Purpose |
|------|---------|
| `database_migrations/031_client_portal_files.sql` | Migration for visibility column |
| `services/client-portal.service.ts` | New client portal service |
| `components/work-orders/client-hub/ClientFilesManager.tsx` | File visibility UI |

### Files Modified
| File | Changes |
|------|---------|
| `types/database.ts` | Added `is_client_visible` to `WorkOrderFile` |
| `services/work-orders.service.ts` | Added 2 visibility methods |
| `app/client-dashboard/page.tsx` | Complete redesign |
| `components/work-orders/client-hub/ClientHubTab.tsx` | Integrated file manager |
| `components/work-orders/client-hub/index.ts` | Export `ClientFilesManager` |

### Dependencies Added
- `jspdf` - Client-side PDF generation

### Git Commits
- `feat: implement Client Portal with WO selector, chat, files tabs, and PDF export`
- `feat: add client file visibility management to internal hub`
- `fix: update file category table name in services`
- `docs: update all documentation for Client Portal (Phase 29) implementation`
- `style: rebrand client portal with Tops Lighting colors`
- `style: soften client portal colors - replace hard red with amber accents`
- `feat: add standard chat alignment - own messages right-aligned`
- `feat: add relative time formatting for recent chat messages`
- `fix: fetch client name correctly via explicit query`

### Testing Notes
- Files appear in "Share More Files" section by default (visibility = false)
- Click "+" to share file with client
- Client portal shows only shared files
- PDF export includes all chat messages with timestamps

### Additional Fixes (Session 16 Continued)
1. **Storage Bucket**: Created `company-assets` bucket for logo uploads with proper policies
2. **Branding Update**: Rebranded client portal from purple to Tops Lighting colors (amber accents, slate buttons)
3. **Chat Alignment**: Own messages right-aligned with amber accent, others left-aligned
4. **Relative Time**: Chat timestamps show "Just now", "5 min ago", etc. for recent messages
5. **Client Name Fix**: Fixed client name display by using explicit query instead of joined syntax


## Session 17: Timesheets V2 Views & Permissions Fix
**Date**: December 29, 2024

### Objectives
1. Create new "My Timesheets" table view with filters and pagination
2. Create "All Timesheets" admin view for super admins
3. Fix missing role permissions for super_admin and admin roles

### Implementation Summary

#### 1. Data Cleanup
- Cleared all transactional timesheet data via `TRUNCATE TABLE ... CASCADE`
- Configuration tables (Activity Types, Locations) preserved

#### 2. Reverted Submitted Timesheet Editing (Migration `035_timesheets_revert_submission_edit.sql`)
- Reverted ability to edit timesheets once submitted
- Users can only edit in Draft or Rejected status
- RLS policies updated to enforce this rule
- `PERMISSIONS.md` updated to reflect restriction

#### 3. "My Timesheets" Table View (`MyTimesheetsTable.tsx`)
New component replacing `WeeklyTotalsWidget` with:
- **Filters**: Date range, status chips, activity type, location, work order
- **Layout**: Grouped table with collapsible day headers
- **Day Headers**: Status dot, formatted date, total hours, status badge, expand/collapse
- **Entry Rows**: Activity + color, Location + color, WO#, Hours, Notes (expandable)
- **Mobile**: Card-based layout with expandable days
- **Pagination**: 14 days per page, newest first

#### 4. "All Timesheets" Admin Tab (`AllTimesheetsTable.tsx`)
New admin-only tab (requires `timesheets:view_all` permission) with:
- **Employee Filter**: Dropdown to filter by specific user
- **All Filters**: Same as My Timesheets plus employee
- **Employee Display**: User name + avatar in day headers
- **Default Range**: 30 days (vs 14 for personal view)
- **RLS Enforcement**: Uses existing `is_internal()` function

#### 5. Service Layer Updates (`timesheets.service.ts`)
New methods:
| Method | Purpose |
|--------|---------|
| `getMyDaysPaginated()` | Paginated days for current user with filters |
| `getAllDaysPaginated()` | Paginated days for all users (admin view) |
| `getTimesheetUsers()` | List of users with timesheet data for dropdown |

#### 6. Permissions Fix (Migration `036_fix_missing_role_permissions.sql`)
**Bug Found**: `roles:manage` and `users:manage` permissions existed but were never assigned to `super_admin` or `admin` roles.

**Fix Applied**: Inserted missing `role_permissions` entries for:
- `super_admin`: +`roles:manage`, +`users:manage`
- `admin`: +`roles:manage`, +`users:manage`

### Files Created
| File | Purpose |
|------|---------|
| `components/timesheets/MyTimesheetsTable.tsx` | User's timesheet table view |
| `components/timesheets/AllTimesheetsTable.tsx` | Admin timesheet view |
| `database_migrations/035_timesheets_revert_submission_edit.sql` | Revert edit access |
| `database_migrations/036_fix_missing_role_permissions.sql` | Fix role-permission links |

### Files Modified
| File | Changes |
|------|---------|
| `services/timesheets.service.ts` | Added 3 paginated methods |
| `app/dashboard/timesheets/page.tsx` | Added My Timesheets + All Timesheets tabs |
| `components/timesheets/index.ts` | Export new components |
| `PERMISSIONS.md` | Updated `timesheets:log_own` description |

### Bug Fixes
1. **New Day Editing**: Fixed bug where users couldn't log time for a brand new day (when `todaysDay` is null)
2. **Admin Permissions**: Fixed missing `roles:manage` and `users:manage` permissions for admin roles

### Tab Structure (After Changes)
| Tab | Permission | Description |
|-----|------------|-------------|
| Log Time | `timesheets:log_own` | Log today's hours |
| My Timesheets | (all users) | Personal timesheet history with filters |
| Request Past Day | `timesheets:request_past_day` | Request to edit past days |
| Approvals | `timesheets:approve` | Approve/reject submitted timesheets |
| All Timesheets | `timesheets:view_all` | Admin view of all employees |

### Git Commits
- `chore: clear test timesheet data`
- `feat(timesheets): revert submit-edit and create migration 035`
- `refactor(timesheets): remove WeeklyTotalsWidget usage in favor of MyTimesheetsTable`
- `feat(timesheets): add My Timesheets table view with filters and pagination`
- `feat(timesheets): add All Timesheets admin tab with employee filter`
- `fix(permissions): add missing roles:manage and users:manage to admin roles`

