# Development Phase Log

## Phase 1: Project Setup & Foundation
**Date**: December 10, 2025

### Completed Tasks
- ✅ Created Next.js 15 project with TypeScript
- ✅ Installed and configured Tailwind CSS
- ✅ Set up Supabase integration
- ✅ Created environment variables configuration
- ✅ Established folder structure (app/, lib/, types/, components/)

### Key Files Created
- `.env.local` - Environment configuration
- `lib/supabase.ts` - Supabase client setup
- `types/database.ts` - TypeScript interfaces

---

## Phase 2: Database Schema Design
**Date**: December 10, 2025

### Completed Tasks
- ✅ Designed database schema for all entities
- ✅ Created SQL migration scripts
- ✅ Set up Row Level Security (RLS) policies
- ✅ Configured Supabase Storage bucket for work orders

### Database Tables Created
1. **technicians** - Employee management
2. **equipment** - Equipment inventory
3. **vehicles** - Fleet management
4. **work_orders** - Job tracking with AI analysis

### Storage Configuration
- Created `work-orders` bucket in Supabase Storage
- Configured RLS policies for file access
- Set up public read access for processed files

---

## Phase 3: Dashboard Layout & Navigation
**Date**: December 10, 2025

### Completed Tasks
- ✅ Created dashboard layout with sidebar
- ✅ Implemented responsive navigation
- ✅ Added mobile hamburger menu
- ✅ Designed dashboard home page with summary cards

### Key Components
- `app/dashboard/layout.tsx` - Main dashboard layout
- `app/dashboard/page.tsx` - Dashboard home
- Responsive sidebar with navigation links
- Top navigation bar with branding

---

## Phase 4: CRUD Pages Implementation
**Date**: December 10, 2025

### Completed Tasks
- ✅ **Technicians Page** - Full CRUD (Create, Read, Delete)
  - Form: name, email, phone, skills (comma-separated)
  - Table: Display all technicians with skill badges
  - Delete functionality with confirmation
  
- ✅ **Equipment Page** - Full CRUD
  - Form: name, type, status dropdown
  - Table: Color-coded status badges
  - Status options: available, in-use, maintenance
  
- ✅ **Vehicles Page** - Full CRUD
  - Form: name, license plate, type, status
  - Table: Vehicle list with status indicators
  - Unique license plate validation
  
- ✅ **Work Orders Page** - Upload & Management
  - File upload: PDF, images (JPG, PNG, GIF)
  - Storage integration with Supabase
  - List view with file links
  - Process/Delete actions

### Design Patterns Used
- Consistent form styling across all pages
- Reusable table layouts
- Color-coded status badges (green/yellow/red)
- Loading states and error handling

---

## Phase 5: AI Integration & Work Order Processing
**Date**: December 10, 2025

### Completed Tasks
- ✅ Installed Google Gemini AI SDK (`@google/generative-ai`)
- ✅ Created API route `/api/process-work-order`
- ✅ Implemented PDF processing with Gemini 2.5 Pro
- ✅ Implemented image analysis with Gemini Vision
- ✅ Structured data extraction from work orders

### AI Features Implemented
- **PDF Analysis**: Direct PDF processing with Gemini
- **Image Analysis**: OCR and understanding of work order images
- **Data Extraction**: Structured JSON output with:
  - Job type, location, client info
  - Resource requirements (tech skills, equipment, vehicles)
  - Staffing needs and timeline estimates
  - Permits, technical requirements, access needs
  - Risk factors, client/technician questions
  - Additional details

### API Endpoint
- **POST** `/api/process-work-order`
  - Input: `{ workOrderId: string }`
  - Output: Structured analysis JSON
  - Updates database with `processed: true` and `analysis` field

---

## Phase 6: Analysis View & UI Enhancements
**Date**: December 10, 2025

### Completed Tasks
- ✅ Created analysis view modal
- ✅ Implemented "View Analysis" button for processed orders
- ✅ Designed comprehensive analysis display layout
- ✅ Added safe rendering for complex data types
- ✅ Fixed React rendering errors for object values

### UI Components
- **Analysis Modal**: Full-screen overlay with scrollable content
- **Sections**: Organized display of all extracted data
  - Job overview (type, location)
  - Client information
  - Resource requirements (color-coded badges)
  - Staffing & timeline
  - Permits and requirements
  - Risk factors (highlighted in red)
  - Questions for follow-up
  - Additional details (formatted JSON if needed)

### Technical Improvements
- Created `safeRender()` helper for type-safe rendering
- Handles strings, numbers, and objects gracefully
- Prevents React "Objects are not valid as React child" errors
- Uses `<pre>` tags for formatted JSON display

---

## Phase 7: Bug Fixes & Model Updates
**Date**: December 10, 2025

### Issues Resolved
1. ✅ **RLS Policy Errors**
   - Fixed work_orders table RLS blocking inserts
   - Disabled RLS for development
   - Created permissive storage policies

2. ✅ **Storage Bucket Policies**
   - Fixed "new row violates row-level security policy" error
   - Configured bucket for anonymous uploads
   - Set up proper read/write/delete policies

3. ✅ **PDF Parsing Issues**
   - Removed problematic `pdf-parse` library
   - Switched to Gemini's native PDF support
   - Fixed module import errors with Next.js/Turbopack

4. ✅ **Model Compatibility**
   - Updated from `gemini-1.5-flash` to `gemini-2.0-flash-exp`
   - Finally updated to `gemini-2.5-pro` (latest model)
   - Fixed model name errors

5. ✅ **React Rendering Errors**
   - Fixed "Objects are not valid as React child" errors
   - Implemented safe rendering for all analysis fields
   - Handles complex nested objects from AI responses

---

## Phase 8: Role-Based Access Control (RBAC)
**Date**: December 11, 2025

### Completed Tasks
- ✅ **Database Schema Design**
  - Created `roles` table for role definitions
  - Created `permissions` table for all system permissions
  - Created `role_permissions` junction table
  - Added `role_id` foreign key to `user_profiles`
  - Seeded Super Admin role with all permissions

- ✅ **Permission System**
  - 37 permissions across 10 resources
  - Resources: users, roles, permissions, work_orders, technicians, equipment, vehicles, reports, settings, dashboard
  - Actions: create, read, update, delete, manage, assign

- ✅ **RBAC Service Layer**
  - Full CRUD for roles
  - Permission management functions
  - User permission queries
  - Role assignment to users

- ✅ **Admin UI**
  - `/dashboard/admin/roles` - Role management with permission checkboxes
  - `/dashboard/admin/users` - User role assignment
  - Permission-based sidebar visibility

- ✅ **React Integration**
  - `usePermissions` hook with context provider
  - `RequirePermission` component for conditional rendering
  - `PermissionsProvider` wrapping dashboard layout

### Key Files Created
- `database_migrations/003_rbac_schema.sql` - RBAC tables and seed data
- `types/rbac.ts` - TypeScript interfaces
- `services/rbac.service.ts` - RBAC business logic
- `hooks/usePermissions.tsx` - Permission context and hooks
- `app/dashboard/admin/roles/page.tsx` - Role management UI
- `app/dashboard/admin/users/page.tsx` - User management UI

### Default Roles Planned
1. Super Admin - Full system access
2. Owner - Business owner access
3. Admin - User/resource management
4. Dispatcher - Work order assignment
5. Project Coordinator - Project oversight
6. Sales Person - Client/order creation
7. Technician - Own assignments only
8. Client - View own projects

---

## Current Status

### Working Features
- ✅ Full CRUD for Technicians, Equipment, Vehicles
- ✅ Work order file upload (PDF/images)
- ✅ AI-powered work order analysis
- ✅ Analysis view with formatted display
- ✅ Responsive dashboard layout
- ✅ Status management with color coding
- ✅ Google OAuth authentication
- ✅ User onboarding flow
- ✅ Role-based access control (RBAC) system
- ✅ Admin role management UI
- ✅ Permission-based UI visibility

### Known Limitations
- ⚠️ Need to run RBAC migration in Supabase
- ⚠️ No update/edit functionality (only create/delete)
- ⚠️ No work order assignment to technicians
- ⚠️ No scheduling/calendar view
- ⚠️ No real-time updates

### Next Steps
1. Run RBAC migration in Supabase Dashboard
2. Assign Super Admin role to admin user
3. Create additional roles via admin UI
4. Add update/edit functionality to all CRUD pages
5. Create work order assignment system
6. Build scheduling/calendar view
7. Add analytics and reporting
8. Implement real-time notifications

---

## Phase 9: Multi-file Work Orders & Upload Refactor
**Date**: December 10-12, 2025

### Completed Tasks
- ✅ **Refactored Upload System**
  - Moved from single-file column in `work_orders` to dedicated `work_order_files` table
  - Supported multiple file uploads per work order
  - Preserved metadata (filename, size, mimetype)

### Key Files Created/Modified
- `database_migrations/create_work_order_files.sql` - Migration for new table
- `app/dashboard/work-orders/page.tsx` - Updated upload UI for multi-file support

---

## Phase 10: RBAC Refinement & User Visibility
**Date**: December 12-16, 2025

### Completed Tasks
- ✅ **Admin UI Implementation**
  - Created Roles management page
  - Created User role assignment page
- ✅ **User Visibility Fixes**
  - Fixed RLS policies to allow Admins to see all user profiles
  - Added `office_staff` table for directory management
- ✅ **Vehicle Fleet Expansion**
  - Added detailed vehicle tracking columns (VIN, registration, driver)
  - Seeded extensive vehicle fleet data

### Database Updates
- `004_rbac_manage_policies.sql` - Refined RBAC management policies
- `005_update_vehicles_schema.sql` - New vehicle columns
- `006_seed_vehicles.sql` - Vehicle data seed
- `007_create_office_staff.sql` - New staff table
- `008_fix_user_visibility.sql` - User visibility fixes

### Current Status
- **RBAC**: robust and manageable via UI
- **Fleet**: detailed and populated
- **User Management**: fully functional for key admin tasks

---

## Phase 11: Clients & Project Managers Module
**Date**: December 18, 2025

### Completed Tasks
- ✅ **Database Schema**
  - Created `clients` table for corporate entities
  - Created `project_managers` table for client contacts
  - Added `client_id` and `pm_id` to `work_orders` table
  - RLS policies enabled with permissive access

- ✅ **Service Layer**
  - Full CRUD for clients
  - Full CRUD for project managers
  - Search functionality for both entities
  - Work order assignment/unassignment

- ✅ **UI Components**
  - `ClientForm` and `ProjectManagerForm` components
  - Client directory with search
  - Client detail view with tabbed interface
  - Work order client assignment modal

- ✅ **Work Order Integration**
  - "Link to Client" action on unassigned orders
  - Cascading dropdown (Client → PM)
  - "Unlink" action to remove assignment

### Key Files Created
- `database_migrations/009_clients_and_pms.sql` - Database migration
- `services/clients.service.ts` - Client and PM service layer
- `components/forms/ClientForm.tsx` - Client form
- `components/forms/ProjectManagerForm.tsx` - PM form
- `app/dashboard/clients/page.tsx` - Clients directory
- `app/dashboard/clients/[id]/page.tsx` - Client detail view

### Design Decisions
1. **Project Managers vs Office Staff**: PMs are labeled as "Client Contacts" in the UI to clearly distinguish from internal `office_staff`
2. **Safe Rendering**: All display fields use `safeRender()` helper to prevent React object errors
3. **No AI Modification**: Gemini processing logic remains unchanged for this phase
4. **Manual Assignment**: Work order → Client linkage is manual (no auto-detection)

### Next Steps
1. ~~Run migration in Supabase Dashboard~~ ✅ Complete
2. ~~Update Supabase types~~ ✅ Complete
3. Add entity-specific permissions for clients (future)
4. Consider auto-linking based on AI-extracted client name (future)

---

## Phase 12: Advanced Work Order System (Sub-Phase A)
**Date**: December 18, 2025
**Objective**: Foundation for advanced work order features including logistics, numbering, and detailed tracking.

### Completed Tasks
- ✅ **Database Schema Update**
  - Added `work_order_number`, `site_address`, `planned_date`, `work_order_date` to `work_orders`
  - Created `job_types` table
  - Created `work_order_assignments` table for multiple technicians
  - Created `work_order_shipments` table for tracking
  - Created `shipment-photos` bucket
- ✅ **Service Layer Enhancements**
  - CRUD for Job Types
  - Advanced Technician Assignment (multi-select)
  - Shipment Management (CRUD + Photos)
- ✅ **UI Development**
  - `ShipmentManager` component with unified receiver dropdowns
  - `RecentShipmentsWidget` for dashboard
  - New `WorkOrderDetailPage` with editable details and shipment tracking
  - Updated Work Orders list with new columns
  - Added "Client" and "Project Manager" visibility
  - Improved "Assign Technicians" UI with search and toggle mode
- ✅ **AI Integration**
  - Updated Gemini prompt to extract Work Order Number, Site Address, and Date
  - Sanitized AI inputs to prevent 500 errors

### Key Files Created/Modified
- `database_migrations/010_advanced_wo_foundation.sql`
- `database_migrations/012_add_recommended_techs.sql`
- `services/work-orders.service.ts`
- `components/work-orders/ShipmentManager.tsx`
- `components/dashboard/RecentShipmentsWidget.tsx`
- `app/dashboard/work-orders/[id]/page.tsx`
- `app/api/process-work-order/route.ts`

### Next Steps
1. Execute `010_advanced_wo_foundation.sql` migration
2. Create `shipment-photos` storage bucket
3. Test new AI extraction with real documents
4. Begin Sub-Phase B (Inventory/Stock integration)

---

## Phase 12-B: Work Order UI Workflows
**Date**: December 18, 2025

### Completed Tasks
- ✅ **UI Overhaul**
  - Moved upload interface to modal
  - Implemented clean data table layout
- ✅ **Search & Filter System**
  - Implemented multi-criteria filtering (Status, Job Type, Client, Date)
  - Implemented text search
- ✅ **UX Improvements**
  - "Assign Client" quick action in table
  - "Job Type" visibility
  - Improved date formatting (DD-MMM-YYYY)

---

## Phase 13: Settings & Configuration
**Date**: December 18, 2025

### Completed Tasks
- ✅ **Unified Settings Module**
  - Consolidated RBAC (Roles & Users) into a single "Settings" area
  - Replaced multiple Sidebar admin items with a single "Settings" entry
- ✅ **Job Types Management**
  - Implemented UI for managing system Job Types
  - Connected to `job_types` table in Supabase
- ✅ **User Experience Polish**
  - Replaced Logout button with rich **User Profile Dropdown**
  - Added "Profile Settings" page for viewing account details
  - Improved Avatar component integration



## Phase 12-C: Task Management & AI Checklists
**Date**: December 18-19, 2025
**Objective**: Implement granular task tracking, technician assignments, and AI-driven checklists for work orders.

### Completed Tasks
- ✅ **Database Schema Implementation**
  - Created `work_order_tasks` for individual actionable items
  - Created `task_assignments` for technician linking
  - Created `task_checklists` for granular sub-items
  - Created `checklist_templates` & `checklist_template_items` for standardized processes
- ✅ **Service Layer**
  - CRUD operations for Tasks, Checklists, and Templates
  - Task progress calculation
  - Logic to apply templates to tasks
- ✅ **UI Development**
  - `WorkOrderTasks` component embedded in Work Order Detail page
  - Task creation, editing, deletion, and assignment UI
  - Checklist management (add, toggle, delete)
  - "Checklist Templates" settings page for managing standard lists
- ✅ **AI Integration**
  - Updated Gemini prompt to extract `scope_of_work` and `suggested_tasks`
  - Automated creation of "Pending" tasks from AI analysis
- ✅ **Type Safety**
  - Updated `types/supabase.ts` with new schema definitions

### Current Status
- **Tasks**: Fully functional with status, priority, and progress tracking
- **Templates**: Can be created and applied to tasks
- **AI**: Automatically suggests tasks from documents

---

## Phase 14: AI Migration & UI Enhancements
**Date**: December 19, 2025
**Objective**: Migrate AI provider, add file viewer, and enhance task management UI.

### Completed Tasks
- ✅ **AI Provider Migration**
  - Switched from OpenAI to Google Gemini (`gemini-3-flash-preview`)
  - Implemented native PDF and image support via `inlineData`
  - Set `responseMimeType: 'application/json'` for reliable JSON output
  - Added safety block to prevent hallucinations when no valid files are present

- ✅ **Database Migration Fixes**
  - Made migration files idempotent with `DROP POLICY IF EXISTS` and `CREATE INDEX IF NOT EXISTS`
  - Affected files: `010_advanced_wo_foundation.sql`, `011_tasks_and_checklists.sql`

- ✅ **File Viewer Modal**
  - Created `FileViewerModal.tsx` component for in-app PDF/image viewing
  - Supports `<img>` for images, `<iframe>` for PDFs
  - Added file navigation (arrows), download, and open-in-new-tab buttons
  - Replaced "View Analysis" button with "View WO" on work order detail page

- ✅ **Task UI Enhancements**
  - Task descriptions show 3 lines when collapsed (was 1), full text when expanded
  - Added inline edit for checklist items with prominent Edit/Delete icons
  - Added "Edit Task" button and modal with Name, Description, Priority, Due Date
  - Tech assignment dropdown opens above (prevents cutoff)
  - Already-assigned techs highlighted with green background and checkmark

### Key Files Modified
- `app/api/process-work-order/route.ts` - Gemini integration
- `components/work-orders/FileViewerModal.tsx` - New file viewer
- `components/work-orders/WorkOrderTasks.tsx` - Task UI enhancements
- `services/work-orders.service.ts` - Added `updateChecklistItem`
- `database_migrations/*.sql` - Made idempotent

---

## Phase 15: Shipping Comments & Upload Flow Refactor
**Date**: December 19, 2025
**Objective**: Implement threaded shipping comments system and refactor work order upload into a two-step review workflow.

### Completed Tasks

#### A. Shipping Comments System
- ✅ **Database Migration (`014_shipping_comments.sql`)**
  - Created `work_order_shipping_comments` table
  - Columns: id, work_order_id, user_id, content, created_at, updated_at
  - RLS enabled: Users can only edit/delete their own comments
  - Indexes for performance on work_order_id, user_id, created_at

- ✅ **Service Layer Updates**
  - Added `getShippingComments()` - Fetch all comments for a WO
  - Added `addShippingComment()` - Create new comment with user attribution
  - Added `updateShippingComment()` - Edit own comments
  - Added `deleteShippingComment()` - Remove own comments

- ✅ **UI Components**
  - Created `ShippingComments.tsx` component
  - Displays comments newest-first with user avatars
  - Inline editing and deletion for own comments
  - Integrated into Work Order Detail page "Shipments & Tracking" section

#### B. Work Order Upload Flow Refactor
- ✅ **Two-Step Upload Process**
  1. **Upload Modal**: User selects files only
  2. **AI Processing**: Create WO in DB, upload files, run AI analysis
  3. **Review Modal**: User verifies/enriches extracted data

- ✅ **New WorkOrderReviewModal Component**
  - Pre-fills Site Address from AI extraction
  - AI recommendations for Client and Job Type matching
  - Dropdowns for: WO Owner, Job Type, Client, Project Manager
  - Initial Shipping Comment entry (moved from upload form)
  - Updates work order record on save

- ✅ **WorkOrderUploadForm Simplification**
  - Removed "Initial Shipping Comment" field
  - Simplified submit handler (files only)
  - Button renamed to "Upload & Analyze"

- ✅ **WorkOrdersPage State Management**
  - Added `isReviewOpen` and `currentWorkOrder` state
  - Seamless transition: Upload Modal → Review Modal
  - Work order persists in DB even if review is cancelled

### Key Files Modified
- `database_migrations/014_shipping_comments.sql` - New migration
- `components/work-orders/ShippingComments.tsx` - New component
- `components/work-orders/WorkOrderReviewModal.tsx` - New component
- `components/work-orders/WorkOrderUploadForm.tsx` - Simplified
- `app/dashboard/work-orders/page.tsx` - Two-step flow
- `app/dashboard/work-orders/[id]/page.tsx` - Shipping comments integration
- `services/work-orders.service.ts` - Shipping comment CRUD
- `types/database.ts` - ShippingComment interface

### Current Status
- **Shipping Comments**: Fully functional with RLS-protected edit/delete
- **Upload Flow**: Two-step process with mandatory review
- **AI Integration**: Automatically extracts and suggests Client/Job Type matches

---

## Phase 16: Task Comments System
**Date**: December 19, 2025

### Overview
Implemented a threaded comment system for individual work order tasks with @mention functionality and file attachments.

### Completed Tasks

#### A. Database Schema
- ✅ **work_order_task_comments table**
  - Threaded comments on individual tasks
  - Text content with attachments array (max 5 files)
  - created_at and updated_at timestamps
  - FK to work_order_tasks and user_profiles

- ✅ **task_comment_mentions table**
  - Junction table for @mentions
  - Supports both user_profiles and technicians
  - For future notification system

- ✅ **RLS Policies**
  - Read: All authenticated users
  - Insert: Authenticated users
  - Update/Delete: Only comment owner

#### B. Service Layer Methods
- `getTaskComments(taskId)` - Fetch with user profiles and mentions
- `getTaskCommentCount(taskId)` - Count for badge display
- `addTaskComment(...)` - Create with attachments and mentions
- `updateTaskComment(...)` - Edit own comments
- `deleteTaskComment(commentId)` - Delete own comments
- `getMentionableUsers(workOrderId)` - Office staff + assigned techs + WO owner
- `uploadCommentAttachment(taskId, file)` - 25MB limit, PDF/images only

#### C. UI Components
- ✅ **TaskCommentsPanel** - Slide-out panel triggered from task cards
  - @mention dropdown with type-ahead filtering
  - File attachment with image thumbnails (96×96px)
  - PDF file cards with icon display
  - Edit/delete own comments with "(edited)" indicator
  - FileViewerModal integration for attachment preview
  - Comment count badge on task cards

### Key Files
- `database_migrations/015_task_comments.sql`
- `components/work-orders/TaskCommentsPanel.tsx`
- `services/work-orders.service.ts` (new methods)

---

## Phase 17: Task Categories and Tags
**Date**: December 19, 2025

### Overview
Added two classification systems for tasks: WO-scoped categories (single-select) and global tags (multi-select), both with color support.

### Completed Tasks

#### A. Database Schema
- ✅ **work_order_categories table**
  - Categories scoped to each work order
  - Single category per task
  - Color support (hex values)
  - Unique constraint on (work_order_id, name)

- ✅ **task_tags table**
  - Global tags shared across all work orders
  - Multi-select per task
  - Color support
  - Unique name constraint

- ✅ **task_tag_assignments table**
  - Junction table for task-tag relationships
  - Unique constraint per task-tag pair

- ✅ **work_order_tasks update**
  - Added `category_id` FK column

#### B. Service Layer Methods
- Category CRUD: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- Tag CRUD: `getAllTags`, `createTag`, `updateTag`, `deleteTag`
- Task assignments: `getTaskTags`, `assignTagsToTask`, `setTaskCategory`

#### C. UI Components
- ✅ **CategorySelector** - Dropdown with:
  - Existing WO categories
  - Inline creation with color picker
  - 10 preset colors

- ✅ **TagSelector** - Multi-select dropdown with:
  - Search/filter functionality
  - All global tags display
  - Inline creation with color picker
  - Tag pills with remove buttons

- ✅ **WorkOrderTasks Updates**
  - Category badge with folder icon on task cards
  - Tag pills on task cards
  - Selectors in Create Task modal
  - Selectors in Edit Task modal

### Key Files
- `database_migrations/016_task_categories_and_tags.sql`
- `components/work-orders/CategorySelector.tsx`
- `components/work-orders/TagSelector.tsx`
- `components/work-orders/WorkOrderTasks.tsx`

### Future Enhancements
- Settings page for global tag management (admin CRUD)
- Notification system for @mentions
- Reporting/filtering by category and tags

---

## Phase 18: File Categorization System
**Date**: December 20, 2025

### Overview
Implemented a robust file organization system with hierarchical folders (categories), RBAC enforcement, and drag-and-drop file management.

### Completed Tasks

#### A. Database Schema
- ✅ **file_categories table**:
  - Hierarchical structure (`parent_id`)
  - System vs custom categories (`is_system`)
  - RBAC levels (`office`, `field`, `office_only`)
  - Ordering support
- ✅ **work_order_files updates**:
  - `category_id`: Foreign key to file categories
  - `uploaded_by`: Linked to user profiles

#### B. Service Layer
- ✅ **Category Management**:
  - `initializeSystemCategories`: Creates standard folder structure (Work Order, Pictures, etc.)
  - `create/delete` custom categories
- ✅ **File Management**:
  - `uploadFileToCategory`: Uploads to structured paths
  - `recategorizeFile`: Moves files between categories
  - `deleteFile`: Removes from storage and DB

#### C. UI Components
- ✅ **WorkOrderUploadForm**:
  - Categorized upload interface
  - Custom category creation during upload
- ✅ **WorkOrderFilesCard**:
  - Hierarchical file explorer (accordion style)
  - RBAC-aware actions (upload, delete, move)
  - Folder and file status indicators
- ✅ **Integration**:
  - Embedded in Work Order Detail page
  - Seamless transition from upload to organized view

### Key Files
- `database_migrations/017_file_categories_schema.sql`
- `services/work-orders.service.ts`
- `components/work-orders/WorkOrderUploadForm.tsx`
- `components/work-orders/WorkOrderFilesCard.tsx`

### Bug Fixes (Session 13 Continuation)
1. **Upload Modal UI**: Fixed clipping/scrolling by using Modal's native footer for action buttons
2. **Form Submission**: Added `type="button"` to all in-form buttons to prevent accidental submission
3. **AI Processing Path**: Fixed file path extraction in `process-work-order` API to work with new category-based storage paths

---

## Phase 19: Work Order Scheduling & Review
**Date**: December 22, 2025

### Overview
 implemented robust scheduling capabilities for work orders, including multi-date support, estimated duration, and a "Review Needed" workflow for incomplete work orders.

### Completed Tasks

#### A. Database Schema
- ✅ **New Scheduling Fields**:
  - `estimated_days` (integer): Duration of the job
  - `scheduling_notes` (text): Special instructions for scheduling
  - `planned_dates` (date[]): Array of scheduled dates (replaced single `planned_date`)
  - `review_needed` (boolean): Flag for manual attention

- ✅ **Migration (`018_wo_scheduling_fields.sql`)**:
  - Adds new columns
  - Migrates existing `planned_date` data to `planned_dates` array
  - Drops legacy `planned_date` column

#### B. UI Components
- ✅ **WorkOrderReviewModal & EditModal**:
  - Added "Est. Days" and "Scheduling Notes" inputs
  - Implemented multi-date picker component
  - Removed single date picker

- ✅ **WorkOrderDetailHeader**:
  - Added "Review Needed" badge with popover
  - Popover lists missing fields (Client, PM, Owner)
  - Displays formatted list of planned dates

#### C. Backend Integration
- ✅ **API Updates**:
  - `process-work-order`: Converts AI-extracted single date to `planned_dates` array
- ✅ **Service Layer**:
  - Updated `create` and `update` methods to handle new fields

### Key Files
- `database_migrations/018_wo_scheduling_fields.sql`
- `components/work-orders/WorkOrderDetailHeader.tsx`
- `components/work-orders/WorkOrderReviewModal.tsx`
- `components/work-orders/WorkOrderEditModal.tsx`

### Addendum: UI Refinements & Build Verification
- **Header Layout**: Streamlined `WorkOrderDetailHeader` by removing section labels and realigning key info (WO #, Status, Job Type).
- **Build Fixes**: Resolved strict type compatibility issues in `types/database.ts` (optional fields) and `clients.service.ts`.
- **Status**: Ready for production deployment.

---

## Phase 20: Pending Items
- [ ] Run `017_file_categories_schema.sql` migration in Supabase
- [ ] Run `018_wo_scheduling_fields.sql` migration in Supabase
- [ ] Verify RBAC enforcement in RLS policies
- [ ] Test full upload → categorize → AI analysis workflow

---

## Phase 21: Unified User Identity (December 22, 2025)

### Objective
Centralize user identity in `user_profiles` table and link `technicians`/`office_staff` as extension tables.

### Database Changes (`019_unified_user_identity.sql`)
- Added new columns to `user_profiles`:
  - `nick_name` (TEXT) - Display alias
  - `user_types` (TEXT[]) - Array of functional types: 'technician', 'office_staff', etc.
  - `is_active` (BOOLEAN) - Soft-delete/archive support
  - `email` (TEXT, UNIQUE) - For Google Sign-in linking
- Added `user_profile_id` (UUID, FK) to `technicians` and `office_staff` tables
- Created indexes for the new FK columns
- Added simplified RLS policies for authenticated users

### Service Layer Updates
- **[NEW] `migration.service.ts`**: One-time utility to link existing data
  - `migrateToUnifiedProfiles()`: Links technicians/office_staff to user_profiles by email
  - `getMigrationStatus()`: Reports linked vs unlinked record counts
  - `findOrCreateProfile()`: Helper for email-based profile lookup
- **[UPDATED] `work-orders.service.ts`**:
  - `getReceiverOptions()`: Now queries with user_profile join, prefers `display_name`
  - `enrichShipmentsWithReceiverNames()`: Joins user_profiles for display names

### Type Updates
- Updated `types/supabase.ts`:
  - Added `user_profile_id` to technicians and office_staff
  - Added `nick_name`, `user_types`, `is_active`, `email` to user_profiles
- Updated `types/database.ts`:
  - Added `user_profile_id` to `Technician` and `OfficeStaff` interfaces

### Key Files Modified
- `database_migrations/019_unified_user_identity.sql`
- `services/migration.service.ts` (NEW)
- `services/work-orders.service.ts`
- `services/index.ts`
- `types/supabase.ts`
- `types/database.ts`
- `types/user-profile.ts`

### Next Steps
- [ ] Run migration service to link existing records by email
- [ ] Test receiver dropdowns with linked profiles
- [ ] Update admin UI to manage user_types and is_active flags

---

## Phase 22: Centrally Managed Identity - Auth Flow (December 22, 2025)

### Objective
Implement "Guest List" authentication - only pre-registered emails can access the app.

### Auth Callback Changes (`app/auth/callback/route.ts`)
- On Google Sign-in, retrieve user's email from metadata
- Search `user_profiles` for matching email record
- **If found**: Create/update profile with auth user's ID, link pre-created data
- **If NOT found**: Sign user out, redirect to `/unauthorized` page

### New Pages
- **`app/unauthorized/page.tsx`**: Explains access denial, provides contact instructions

### Middleware Updates (`lib/supabase/middleware.ts`)
- Added `/unauthorized` bypass for unauthenticated access
- Added `is_active` check - deactivated users are signed out
- Cleaner onboarding redirect logic

### Type Updates (`types/user-profile.ts`)
- Made identity fields non-optional (they're now always present)
- Added `nick_name` to `OnboardingFormData` and `UserProfileUpdate`
- Added `is_active` and `user_types` to `UserProfileUpdate`

### Key Files Modified
- `app/auth/callback/route.ts`
- `app/unauthorized/page.tsx` (NEW)
- `lib/supabase/middleware.ts`
- `types/user-profile.ts`

### Security Model
- Users cannot self-register
- Admins pre-create profiles with email addresses
- On first sign-in, user "claims" their profile
- Deactivated users (`is_active: false`) are immediately signed out

---

## Phase 23: Unified User Management UI (December 22, 2025)

### Objective
Implement centralized user management in Settings > Users and refactor People directories.

### New Service (`services/users.service.ts`)
- `getAll()` / `getActive()` - Fetch all users with extension data
- `getTechnicians()` / `getOfficeStaff()` - Filtered views for directories
- `create(data)` - Create user with optional technician/office_staff records
- `update(id, data)` - Update across all three tables
- `archive(id)` / `restore(id)` - Soft delete/restore
- `isEmailTaken(email)` - Uniqueness check

### New Component (`components/settings/UserFormModal.tsx`)
- Full Name, Nick Name, Email fields
- RBAC Role dropdown
- Technician checkbox → shows Skills multi-select
- Office Staff checkbox → shows Job Title input
- Auto-sets `onboarding_completed: true` for admin-created users

### Updated Pages
- **`app/dashboard/settings/users/page.tsx`**:
  - Add User button with UserFormModal
  - Edit/Archive/Restore actions (no Delete)
  - Show archived toggle
  - User types badges (Tech, Office)

### Refactored Components
- **`components/people/TechniciansTab.tsx`**: Read-only view, removed Add/Edit/Delete
- **`components/people/OfficeStaffTab.tsx`**: Read-only view, removed Add/Edit/Delete
- Both now use `usersService` and link to Settings > Users for management

### Key Files Modified
- `services/users.service.ts` (NEW)
- `services/index.ts`
- `components/settings/UserFormModal.tsx` (NEW)
- `app/dashboard/settings/users/page.tsx`
- `components/people/TechniciansTab.tsx`
- `components/people/OfficeStaffTab.tsx`

### Architecture
- **Creation**: Settings > Users is the ONLY place to create/edit users
- **Directories**: People > Technicians/Office Staff are read-only filtered views
- **Archive**: Soft delete preserves data for historical records

---

## Phase 24: Invitation System & Auth Refinement
**Date**: December 22, 2025

### Summary
Implemented a proper invitation-based user registration system to fix authentication issues caused by FK constraints between `user_profiles` and `auth.users`. Replaced direct profile creation with an invitations table that allows admins to pre-register users by email.

### New Database Table (`invitations`)
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `email` | TEXT | Invited user's email (unique) |
| `display_name` | TEXT | User's full name |
| `nick_name` | TEXT | Optional nickname |
| `role_id` | UUID | Pre-assigned RBAC role |
| `is_technician` | BOOLEAN | Generate technician record on claim |
| `is_office_staff` | BOOLEAN | Generate office_staff record on claim |
| `skills` | TEXT[] | Technician skills |
| `job_title` | TEXT | Office staff title |
| `invited_by` | UUID | Admin who created invitation |
| `claimed_at` | TIMESTAMPTZ | When user signed in |
| `claimed_by` | UUID | Auth user who claimed |

### Auth Flow Changes
1. **Invite User**: Admin creates invitation with email, name, role, and types
2. **User Signs In**: Auth callback checks `invitations` table
3. **Invitation Found**: Creates `user_profile`, `technician`, `office_staff` records; marks invitation as claimed
4. **No Invitation**: Redirects to `/unauthorized` page

### Key Files Modified/Created
- `database_migrations/021_invitations_table.sql` (NEW)
- `services/users.service.ts` - Complete rewrite for invitation-based flow
- `components/settings/UserFormModal.tsx` - Renamed to `InviteUserModal`
- `components/settings/EditUserModal.tsx` (NEW) - Edit existing users
- `app/auth/callback/route.ts` - Uses service role client, checks invitations
- `lib/supabase/middleware.ts` - Simplified, removed aggressive redirects
- `app/dashboard/settings/users/page.tsx` - Tabs for Active Users & Pending Invitations
- `types/supabase.ts` - Added `invitations` table type

### RLS Policies Fixed
- Removed infinite recursion in `user_profiles` policies
- Simple policies: authenticated can read, users manage own profile, allow inserts

### UI Enhancements
- **User Management Page**: Tabbed view (Active Users / Pending Invitations)
- **Invite User Modal**: Create invitations with role, types, skills, job title
- **Edit User Modal**: Change role, phone, types for existing users
- **Revoke Invitation**: Delete pending invitations

---

## Phase 25: Client Portal - Foundation
**Date**: December 22, 2025

### Summary
Implemented external client portal for Project Managers (client contacts) to access work order information via email/password authentication, separate from the internal Google OAuth flow.

### Architecture
- **Internal Team**: Google OAuth → `/login` → `/dashboard`
- **Client Contacts**: Email/Password → `/client-login` → `/client-dashboard`
- **User Type**: `user_types: ['client']` identifies portal users

### Database Changes

#### Migration: `022_project_manager_auth.sql`
```sql
ALTER TABLE project_managers 
ADD COLUMN user_profile_id UUID REFERENCES user_profiles(id);
```

### New Pages
| Route | Purpose |
|-------|---------|
| `/client-login` | Email/password login for client contacts |
| `/client-dashboard` | Placeholder dashboard for clients |

### Server Action
**`app/actions/client-accounts.ts`**
- `createClientAccount()`: Uses `SUPABASE_SERVICE_ROLE_KEY` to create auth users
- Creates `user_profiles` with `user_types: ['client']`
- Links PM record via `user_profile_id`
- `generateSecurePassword()`: Auto-generate secure passwords

### UI Components
**`components/clients/CreatePortalAccountModal.tsx`**
- Triggered from Client Detail page PM cards
- Password input with auto-generate button
- Credentials summary with copy-to-clipboard

### Client Detail Page Updates
- Added "Portal Access" column showing badge status
- Added "Create Portal" button for PMs without portal access
- Integrated `CreatePortalAccountModal`

### Middleware Updates
- `/client-login`: Allows unauthenticated access
- `/client-dashboard`: Requires auth + validates `user_types: ['client']`
- Non-clients accessing client routes are signed out

### Future (Phase 2)
- `work_order_client_access` junction table for WO-scoped permissions
- "Clients" tab on WO detail page to grant access
- Client dashboard shows only accessible WOs

---

## Phase 18: Team Tab & Real-Time Chat
**Date**: December 23, 2025

### Overview
Added a Team tab to Work Order detail pages that displays the complete WO team (owner, office staff, technicians) and provides a real-time team chat feature.

### Database Schema

#### 1. `work_order_team`
Office staff assignments to work orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `work_order_id` | UUID | FK → work_orders (CASCADE) | Work order reference |
| `user_profile_id` | UUID | FK → user_profiles (CASCADE) | Office staff user |
| `added_at` | TIMESTAMPTZ | DEFAULT NOW() | Assignment timestamp |

**Unique constraint**: `(work_order_id, user_profile_id)`

#### 2. `work_order_chat_messages`
Team chat messages for work orders.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY | Unique identifier |
| `work_order_id` | UUID | FK → work_orders (CASCADE) | Work order reference |
| `user_profile_id` | UUID | FK → user_profiles (CASCADE) | Message author |
| `message` | TEXT | NOT NULL, max 2000 chars | Message content |
| `file_references` | UUID[] | DEFAULT '{}' | Array of work_order_files.id |
| `edited_at` | TIMESTAMPTZ | NULL | Set when message is edited |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |

**RLS Policies**: Only team members (WO owner, office staff, assigned technicians) can read/write.
**Realtime**: Enabled for live chat updates.

### Service Layer Methods
| Method | Purpose |
|--------|---------|
| `getOfficeStaffUsers()` | Fetch all active office staff |
| `addTeamMembers(woId, userIds)` | Add office staff to team |
| `removeTeamMember(woId, userId)` | Remove office staff from team |
| `getTeamMembers(woId)` | Get team members for WO |
| `getFullTeamRoster(woId)` | Get owner, office staff, technicians |
| `getChatMessages(woId)` | Get chat messages |
| `sendChatMessage(woId, msg, files)` | Send new message |
| `editChatMessage(msgId, newMsg)` | Edit own message |
| `deleteChatMessage(msgId)` | Soft delete message |
| `isTeamMember(woId)` | Check team membership |

### UI Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `WorkOrderTeamTab` | `components/work-orders/team/` | Main container with access check |
| `TeamRoster` | `components/work-orders/team/` | WO Owner, Office Staff (add/remove), Technicians |
| `TeamChat` | `components/work-orders/team/` | Real-time chat with Supabase Realtime |
| `ChatMessage` | `components/work-orders/team/` | Single message with hover edit/delete |
| `ChatInput` | `components/work-orders/team/` | Input with file picker modal |

### Features
- **Team Roster**: View WO Owner (read-only), Office Staff (add/remove), Technicians (link to tab)
- **Team Chat**: Real-time messaging with Supabase Realtime subscription
- **File References**: Attach WO files to messages (grouped by category in picker)
- **Edit/Delete**: Hover to reveal action menu on own messages
- **Timestamps**: Relative for recent, absolute for older messages
- **Access Control**: RLS + UI check for team-only access

### Migrations Required
- `024_work_order_team.sql`
- `025_work_order_chat.sql`

### People Directory Redesign (Dec 23, 2025)
- **Unified Table**: Replaced Technician/Office tabs with `PeopleTable`.
- **Role Filters**: Dynamic chips for active roles (`internal` only).
- **Security**: Strict client-side filtering to exclude external users (e.g. Clients).

---

## Phase 26: Role-Based User Type System
**Date**: December 23, 2025

### Overview
Simplified the user type system by making `user_type` (`internal`/`external`) solely determined by the assigned RBAC role, rather than legacy `is_technician`/`is_office_staff` flags.

### Key Changes

#### A. Database & Architecture
- `user_type` now derived from `roles.user_type` column
- Legacy `is_office_staff` and `is_technician` user type toggles removed from UI
- `technicians` table retained for work order assignments (field staff capability)

#### B. Roles Management
- Added `user_type` field to Role Create/Edit modals (Internal/External radio buttons)
- Role cards display Internal/External badge
- `RoleInput` type updated to include `user_type`

#### C. Onboarding Flow
- **Reduced to 2 steps** (was 3):
  - Step 1: Avatar, Nick Name, Phone (editable) + Name (read-only)
  - Step 2: Review card showing assigned Role
- Shows actual RBAC role instead of "role will be assigned later"
- Name locked to invitation value (admin-set)

#### D. Auth Callback
- Now fetches `role.user_type` when creating user profiles
- Uses role's `user_type` instead of hardcoding `'internal'`

#### E. Bug Fixes
- Fixed user role updates not saving (`role_id` missing from update query)
- Removed TYPES column from Settings Users table

### Key Files Modified
| File | Change |
|------|--------|
| `types/rbac.ts` | Added `user_type` to `RoleInput` |
| `services/rbac.service.ts` | `createRole` includes `user_type` |
| `services/users.service.ts` | Fixed `role_id` in `updateUser` |
| `components/settings/UserFormModal.tsx` | Role required, grouped by type |
| `components/settings/EditUserModal.tsx` | Removed user type checkboxes |
| `app/dashboard/settings/roles/page.tsx` | User Type selector and badge |
| `app/dashboard/settings/users/page.tsx` | Removed TYPES column |
| `app/auth/callback/route.ts` | Derives user_type from role |
| `app/onboarding/page.tsx` | Complete rewrite for 2-step flow |

### Current Status
- ✅ User type determined solely by role
- ✅ Onboarding simplified and role-aware
- ✅ Auth callback properly sets user_type
- ✅ Role editing in Settings works correctly

---

## Phase 27: Company Settings
**Date**: December 23, 2025

### Overview
Implemented the Company Info settings page for managing company branding and contact information.

### Database Changes
- **`company_settings`** table with:
  - Single-row constraint (`id = 1`)
  - Fields: `name`, `logo_url`, `phone`, `email`, `website`, `address_line1`, `address_line2`, `city`, `state`, `postal_code`, `country`, `tax_id`
  - Timestamps: `created_at`, `updated_at`
- **New Permission**: `settings:manage_company` (granted to `super_admin`)
- **Storage Bucket**: `company-assets` for logo uploads

### Files Created
| File | Purpose |
|------|---------|
| `database_migrations/029_company_settings.sql` | Migration for table, RLS, permission |
| `services/company-settings.service.ts` | CRUD + logo upload/delete |
| `app/dashboard/settings/company/page.tsx` | Company Info form UI |

### Key Features
- Single-row company settings (enforced via constraint)
- Logo upload with preview and delete
- All contact and address fields
- Permission-controlled editing

---

## Phase 28: Client Hub
**Date**: December 23, 2025

### Overview
Implemented the Client Hub feature for client-facing communication on work orders. This enables authorized internal staff and external client contacts to communicate via a dedicated chat, separate from the internal Team Chat.

### Design Decisions
1. **Two separate chats**: Team Chat (internal) + Client Hub Chat (client-facing)
2. **Visual differentiation**: Purple accent color for Client Hub
3. **Access control**: Technicians cannot access Client Hub
4. **Sender display**: Shows "(Company Name)" for internal, "(Client Name)" for external
5. **File uploads**: Clients can upload via chat with required message
6. **Additional contacts**: Only PMs from the WO's assigned client can be added

### Database Changes (Migration `030_client_hub_schema.sql`)

#### New SQL Function
```sql
can_access_client_hub(wo_id UUID) RETURNS BOOLEAN
```
Checks if current user can access Client Hub:
- WO owner
- Internal team member (non-technician)
- Primary PM (via `work_orders.pm_id`)
- Additional authorized PM (via `work_order_client_access`)

#### New Tables
1. **`work_order_client_access`** - Junction table for additional client contacts
   - `id`, `work_order_id`, `project_manager_id`, `added_by`, `created_at`
   - Unique constraint on `(work_order_id, project_manager_id)`

2. **`work_order_client_chat`** - Client-facing chat messages
   - `id`, `work_order_id`, `sender_id`, `message`, `file_references[]`
   - `sender_company_name` (denormalized for display performance)
   - `is_deleted`, `edited_at`, `created_at`
   - Real-time enabled

#### New Permission
- `client_hub:manage_contacts` - Add/remove additional client contacts (granted to `super_admin`, `admin`)

### Service Layer (`work-orders.service.ts`)
Added 10+ methods:
| Method | Description |
|--------|-------------|
| `getClientHubContacts()` | Returns primary PM + additional contacts |
| `addClientContact()` | Add PM from same client |
| `removeClientContact()` | Remove additional contact |
| `getAvailableClientContacts()` | PMs available to add |
| `getClientChatMessages()` | Fetch chat history |
| `sendClientChatMessage()` | Auto-sets sender_company_name |
| `editClientChatMessage()` | Edit own messages |
| `deleteClientChatMessage()` | Soft delete |
| `uploadClientChatAttachment()` | File upload (PDF/images, 25MB limit) |
| `canAccessClientHub()` | Client-side access check |

### UI Components (`components/work-orders/client-hub/`)
| Component | Purpose |
|-----------|---------|
| `ClientHubTab.tsx` | Main tab with access control, empty states |
| `ContactHierarchy.tsx` | Primary PM + additional contacts with badges |
| `ClientChat.tsx` | Real-time chat with file uploads, purple theme |

### Integration
- Added to Work Order detail page (legacy) as separate section
- Added as tab to Work Orders v2 (beta) page with purple styling
- Shows "Access Restricted" for technicians
- Shows "Assign a client..." when no client assigned

### Key Files
| File | Change |
|------|--------|
| `database_migrations/030_client_hub_schema.sql` | Full migration |
| `types/supabase.ts` | Added table types + `user_profile_id` to `project_managers` |
| `services/work-orders.service.ts` | 10+ new methods |
| `components/work-orders/client-hub/*` | 3 new components |
| `components/work-orders/index.ts` | Export ClientHubTab |
| `app/dashboard/work-orders/[id]/page.tsx` | Integration (legacy) |
| `app/dashboard/work-orders-v2/[id]/page.tsx` | Integration (v2 beta) |


## Phase 29: Client Portal
**Date**: December 23-24, 2025

### Overview
Implemented the client-facing portal for external Project Managers to access work orders, communicate via chat, view shared files, and export chat history to PDF.

### Design Decisions
1. **Separate Portal**: External clients access `/client-dashboard` (not main dashboard)
2. **Purple Theme**: Consistent with Client Hub for brand cohesion
3. **File Visibility Control**: Per-file `is_client_visible` flag (not category-based)
4. **PDF Export**: Includes company branding, WO details, and full chat history
5. **Internal Management**: File visibility toggled from Client Hub tab

### Database Changes (Migration `031_client_portal_files.sql`)
- **New Column**: `work_order_files.is_client_visible BOOLEAN DEFAULT FALSE`
- **Partial Index**: `idx_work_order_files_client_visible` for efficient filtering

### Service Layer

#### New Service: `services/client-portal.service.ts`
| Method | Description |
|--------|-------------|
| `getCurrentProjectManager()` | Get PM record for logged-in user |
| `getAccessibleWorkOrders()` | WOs where user is primary/additional PM |
| `getWorkOrderForClient(woId)` | WO details with owner contact info |
| `getClientVisibleFiles(woId)` | Files marked as client-visible |
| `getChatMessagesForExport(woId)` | Chat messages formatted for PDF |
| `getCompanySettings()` | Company branding for PDF header |
| `canAccessWorkOrder(woId)` | Access control check |

#### Updated Service: `services/work-orders.service.ts`
| Method | Description |
|--------|-------------|
| `getFilesWithVisibility(woId)` | Returns `{clientVisible[], notClientVisible[]}` |
| `toggleFileClientVisibility(fileId, isVisible)` | Toggle file visibility flag |

### UI Components

#### Client Portal (`app/client-dashboard/page.tsx`)
- **Header**: Company logo/name (left) + Client name/PM name + Sign Out (right)
- **Work Order Selector**: Dropdown with WO# and site address
- **WO Detail View**:
  - WO Number, Status badge, PO Number, Site Address
  - Owner contact card (name, phone, email)
- **Tabs**:
  - **Chat**: Real-time messages, send new, PDF export button
  - **Files**: Download client-visible files
  - **Reports**: Placeholder "Coming Soon"

#### Internal File Manager (`components/work-orders/client-hub/ClientFilesManager.tsx`)
- **Shared Files Section**: Thumbnails of client-visible files with ✓ badge
- **Available Files Section**: Collapsible list of unshared files with + button
- **One-Click Toggle**: Click to share/unshare files instantly
- **Empty States**: Helpful guidance when no files uploaded

### PDF Export Features
- Company logo placeholder and name
- Work Order number
- Client name
- Primary PM contact (name, email, phone)
- WO Owner contact (name, email, phone)
- Export timestamp
- Full chat history with sender, company, and timestamp

### Key Files
| File | Purpose |
|------|---------|
| `database_migrations/031_client_portal_files.sql` | Add `is_client_visible` column |
| `services/client-portal.service.ts` | New client portal service |
| `services/work-orders.service.ts` | File visibility methods |
| `types/database.ts` | Updated `WorkOrderFile` interface |
| `app/client-dashboard/page.tsx` | Redesigned portal UI |
| `components/work-orders/client-hub/ClientFilesManager.tsx` | File visibility management |
| `components/work-orders/client-hub/ClientHubTab.tsx` | Integrated file manager |
| `components/work-orders/client-hub/index.ts` | Updated exports |

### Dependencies Added
- `jspdf` - PDF generation for chat export

### Current Status
- ✅ Client portal fully functional
- ✅ File visibility toggle working
- ✅ PDF export working
- ✅ Real-time chat in portal
- ✅ Access control enforced
- ✅ Tops Lighting branding (amber/slate color scheme)
- ✅ Chat alignment (own messages right, others left)
- ✅ Relative time formatting for recent messages
- ✅ Client name display from PM's client relationship
- ✅ Company assets storage bucket for logo uploads


## Phase 30: Timesheets V2 Views & Admin Permissions
**Date**: December 29, 2025

### Overview
Implemented comprehensive timesheet viewing interfaces for both end users and administrators, with robust filtering, pagination, and proper permission enforcement.

### Completed Tasks

#### A. My Timesheets Table View
- ✅ **New Component**: `MyTimesheetsTable.tsx` replacing `WeeklyTotalsWidget`
- ✅ **Filter Bar**: Date range, status chips, activity type, location, work order
- ✅ **Grouped Layout**: Collapsible day headers with nested entry rows
- ✅ **Mobile Responsive**: Card-based layout for small screens
- ✅ **Pagination**: 14 days per page, newest first

#### B. All Timesheets Admin View
- ✅ **New Component**: `AllTimesheetsTable.tsx` (admin-only)
- ✅ **Employee Filter**: Dropdown populated with users who have timesheets
- ✅ **All Filters**: Date range, status, activity, location + employee
- ✅ **Employee Display**: Name + avatar in day headers
- ✅ **Permission Gated**: Requires `timesheets:view_all`

#### C. Service Layer Enhancement
- ✅ `getMyDaysPaginated()` - User's timesheets with pagination
- ✅ `getAllDaysPaginated()` - All users' timesheets for admin
- ✅ `getTimesheetUsers()` - Distinct users with timesheet data

#### D. Edit Access Revert (Migration 035)
- ✅ Reverted ability to edit timesheets once submitted
- ✅ RLS policies enforce Draft/Rejected-only editing
- ✅ UI reflects restriction

#### E. Admin Permissions Fix (Migration 036)
- ✅ **Bug Fixed**: `roles:manage` and `users:manage` were not assigned to `super_admin`/`admin`
- ✅ Added missing role_permissions entries

### Database Migrations
| Migration | Purpose |
|-----------|---------|
| `035_timesheets_revert_submission_edit.sql` | Revert submitted timesheet editing |
| `036_fix_missing_role_permissions.sql` | Add missing admin permissions |

### Key Files
| File | Purpose |
|------|---------|
| `components/timesheets/MyTimesheetsTable.tsx` | User's timesheet history view |
| `components/timesheets/AllTimesheetsTable.tsx` | Admin view for all employees |
| `services/timesheets.service.ts` | 3 new paginated methods |
| `app/dashboard/timesheets/page.tsx` | Tab integration |

### Timesheets Tab Structure
| Tab | Permission | Description |
|-----|------------|-------------|
| Log Time | `timesheets:log_own` | Today's time entry |
| My Timesheets | (all users) | Personal history with filters |
| Request Past Day | `timesheets:request_past_day` | Past day edit requests |
| Approvals | `timesheets:approve` | Approval queue |
| All Timesheets | `timesheets:view_all` | Admin view of all users |

### Current Status
- ✅ My Timesheets fully functional with filters
- ✅ All Timesheets accessible to admins
- ✅ Pagination working correctly
- ✅ Mobile-responsive design
- ✅ Admin permissions restored
- ✅ Timezone bug fixed (dates display correctly in local timezone)

### Bug Fixes Applied
1. **New Day Editing** - Users can log time on brand new days
2. **Admin Permissions** - `roles:manage` and `users:manage` restored for admin roles
3. **Timezone Date Display** - Fixed `new Date("YYYY-MM-DD")` parsing as UTC instead of local time

