# Database Schema Documentation

## Overview
This document describes all database tables, their columns, relationships, and constraints for the Tops Lighting Signage Dashboard application.

---

## Tables

### 1. `technicians`
Stores information about company technicians/employees.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `name` | TEXT | NOT NULL | Technician's full name |
| `email` | TEXT | UNIQUE | Email address |
| `phone` | TEXT | | Phone number |
| `skills` | TEXT[] | | Array of skills (e.g., ["electrical", "welding"]) |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

#### Indexes
- `idx_technicians_email` on `email`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Allow all reads`: SELECT for anon, authenticated
  - `Allow all inserts`: INSERT for anon, authenticated
  - `Allow all updates`: UPDATE for anon, authenticated
  - `Allow all deletes`: DELETE for anon, authenticated

#### Sample Data
```sql
INSERT INTO technicians (name, email, phone, skills) VALUES
('John Smith', 'john@example.com', '555-0101', ARRAY['electrical', 'LED installation']),
('Jane Doe', 'jane@example.com', '555-0102', ARRAY['welding', 'structural']);
```

---

### 2. `equipment`
Tracks company equipment and tools.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `name` | TEXT | NOT NULL | Equipment name |
| `type` | TEXT | | Equipment type/category |
| `status` | TEXT | CHECK (status IN ('available', 'in-use', 'maintenance')) | Current status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

#### Indexes
- `idx_equipment_status` on `status`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Same as technicians (allow all for anon, authenticated)

#### Sample Data
```sql
INSERT INTO equipment (name, type, status) VALUES
('Ladder 24ft', 'Ladder', 'available'),
('Drill Set', 'Power Tools', 'in-use'),
('Welding Machine', 'Welding', 'maintenance');
```

---

### 3. `vehicles`
Manages company vehicle fleet.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `name` | TEXT | NOT NULL | Vehicle name/identifier |
| `license_plate` | TEXT | UNIQUE | License plate number |
| `make` | TEXT | | Vehicle make/manufacturer |
| `driver` | TEXT | | Assigned driver name |
| `registration` | TEXT | | Registration number |
| `gross_weight` | TEXT | | Gross Vehicle Weight (GVW) |
| `vin` | TEXT | | Vehicle Identification Number |
| `type` | TEXT | | Vehicle type (truck, van, etc.) |
| `status` | TEXT | CHECK (status IN ('available', 'in-use', 'maintenance')) | Current status |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |

#### Indexes
- `idx_vehicles_license_plate` on `license_plate`
- `idx_vehicles_status` on `status`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Same as technicians (allow all for anon, authenticated)

#### Sample Data
```sql
INSERT INTO vehicles (name, license_plate, type, status) VALUES
('Truck #1', 'ABC-123', 'Pickup Truck', 'available'),
('Van #2', 'XYZ-789', 'Cargo Van', 'in-use');
```

---

### 4. `work_orders`
Stores work order metadata and AI analysis results. Files are stored in the `work_order_files` table.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `uploaded_by` | UUID | REFERENCES auth.users(id) | User who uploaded (nullable for now) |
| `owner_id` | UUID | REFERENCES user_profiles(id) ON DELETE SET NULL | WO Owner - user responsible for the work order |
| `processed` | BOOLEAN | DEFAULT FALSE | Whether AI has processed this order |
| `analysis` | JSONB | | AI-extracted structured data from all files |
| `work_order_number` | TEXT | | Official work order ID (e.g., WO-12345) |
| `job_type_id` | UUID | REFERENCES job_types(id) ON DELETE SET NULL | Associated job type |
| `site_address` | TEXT | | Location where work will be performed |
| `planned_dates` | DATE[] | | Array of scheduled installation dates |
| `estimated_days` | INTEGER | | Estimated number of days needed for the job |
| `scheduling_notes` | TEXT | | Special scheduling needs (weekend, after hours, etc.) |
| `review_needed` | BOOLEAN | DEFAULT TRUE | Flag indicating if manual review is required |
| `work_order_date` | DATE | | Date the work order was issued |
| `client_id` | UUID | REFERENCES clients(id) ON DELETE SET NULL | Associated client |
| `pm_id` | UUID | REFERENCES project_managers(id) ON DELETE SET NULL | Associated project manager |
| `skills_required` | TEXT[] | | Array of required technician skills |
| `permits_required` | TEXT[] | | Array of required permits |
| `equipment_required` | TEXT[] | | Array of required equipment |
| `materials_required` | TEXT[] | | Array of required materials |
| `recommended_techs` | INTEGER | | AI-recommended number of technicians |
| `scope_of_work` | TEXT | | Full scope of work description |
| `shipment_status` | TEXT | | Initial shipment/materials notes |
| `job_status` | TEXT | CHECK, DEFAULT 'Open' | Workflow status: Open, Active, On Hold, Completed, Submitted, Invoiced, Cancelled |
| `job_status_reason` | TEXT | | Reason when job is On Hold or Cancelled |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

#### Indexes
- `idx_work_orders_uploaded_by` on `uploaded_by`
- `idx_work_orders_processed` on `processed`
- `idx_work_orders_created_at` on `created_at`
- `idx_work_orders_work_order_number` on `work_order_number`
- `idx_work_orders_job_type_id` on `job_type_id`
- `idx_work_orders_client_id` on `client_id`
- `idx_work_orders_job_status` on `job_status`
- `idx_work_orders_owner_id` on `owner_id`

#### Row Level Security (RLS)
- **Enabled**: No (disabled for development)
- **Future Policies** (when auth is implemented):
  - Users can insert their own work orders
  - Users can read their own work orders
  - Users can update their own work orders
  - Users can delete their own work orders

#### Analysis JSON Structure
The `analysis` field contains structured data extracted by AI from all associated files:

```json
{
  "jobType": "LED Sign Installation",
  "location": "123 Main St, City, State 12345",
  "orderedBy": "ABC Company",
  "contactInfo": "john@abc.com, 555-1234",
  "resourceRequirements": {
    "techSkills": ["electrical", "LED installation"],
    "equipment": ["ladder", "drill set"],
    "vehicles": ["truck"]
  },
  "permitsRequired": ["Electrical permit", "Building permit"],
  "numberOfTechs": "2 technicians (1 lead electrician, 1 assistant)",
  "estimatedHours": 8,
  "estimatedDays": 1,
  "clientQuestions": ["What is the warranty?", "Installation timeline?"],
  "technicianQuestions": ["Power source location?", "Access restrictions?"],
  "technicalRequirements": "220V power supply, weatherproof installation",
  "accessRequirements": "Roof access required, safety harness needed",
  "riskFactors": ["Working at height", "Electrical hazard"],
  "additionalDetails": "Customer prefers morning installation"
}
```

---

### 5. `work_order_files`
Stores multiple files associated with each work order, organized by category.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | REFERENCES work_orders(id) ON DELETE CASCADE | Associated work order |
| `category_id` | UUID | REFERENCES file_categories(id) ON DELETE SET NULL | File category |
| `file_url` | TEXT | NOT NULL | Supabase Storage URL to the file |
| `file_name` | TEXT | | Original filename |
| `file_size` | INTEGER | | File size in bytes |
| `mime_type` | TEXT | | MIME type of the file |
| `uploaded_by` | UUID | REFERENCES user_profiles(id) | User who uploaded the file |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

#### Indexes
- `idx_work_order_files_work_order_id` on `work_order_id`
- `idx_work_order_files_category_id` on `category_id`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Cascade Delete**: When a work order is deleted, all associated files are automatically deleted

#### Storage Path Structure
Files are stored in Supabase Storage at:
```
work-orders/{workOrderId}/{categorySlug}/{timestamp}_{filename}
```

#### Supported File Types
- **PDFs**: Work orders, specifications, plans
- **Images**: JPG, JPEG, PNG, GIF, WEBP (site photos, diagrams)

---

### 5.1 `file_categories`
Hierarchical categories for organizing work order files.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | NOT NULL, REFERENCES work_orders(id) ON DELETE CASCADE | Associated work order |
| `name` | TEXT | NOT NULL | Category name (e.g., "Work Order", "Pictures") |
| `slug` | TEXT | | URL-friendly identifier |
| `parent_id` | UUID | REFERENCES file_categories(id) ON DELETE CASCADE | Parent category for subcategories |
| `rbac_level` | TEXT | DEFAULT 'office' | Access level: 'office', 'field', 'office_only' |
| `is_system` | BOOLEAN | DEFAULT false | Whether this is a system-defined category |
| `created_by` | UUID | REFERENCES user_profiles(id) | User who created the category |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Creation timestamp |

#### System Categories
The following categories are auto-created for each work order:
- **Work Order** (required)
- **Survey**
- **Plans**
- **Art Work**
- **Pictures** (with subcategories: Reference, Before, WIP, After, Other)
- **Tech Docs** (with subcategories: Permits, Safety Docs, Expense Receipts)
- **Office Docs** (with subcategories: Quote, Client PO)

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Read access for authenticated users, write access based on RBAC level


---

### 5.5 `work_order_shipping_comments`
Stores threaded comments for tracking shipping conversations with clients.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | NOT NULL, REFERENCES work_orders(id) ON DELETE CASCADE | Associated work order |
| `user_id` | UUID | NOT NULL, REFERENCES user_profiles(id) ON DELETE CASCADE | User who created the comment |
| `content` | TEXT | NOT NULL | Comment content |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Comment creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

#### Indexes
- `idx_shipping_comments_work_order_id` on `work_order_id`
- `idx_shipping_comments_user_id` on `user_id`
- `idx_shipping_comments_created_at` on `created_at DESC`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Allow all reads`: SELECT for authenticated users
  - `Allow authenticated inserts`: INSERT for authenticated users
  - `Allow users to update own`: UPDATE only for comment owner (user_id = auth.uid())
  - `Allow users to delete own`: DELETE only for comment owner (user_id = auth.uid())

---

### 6. `user_profiles`
Stores extended user profile information collected during onboarding.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User's auth ID |
| `display_name` | TEXT | NOT NULL | User's display name |
| `nick_name` | TEXT | | Short display name for compact UIs |
| `email` | TEXT | | User's email address |
| `avatar_url` | TEXT | | Profile picture URL |
| `phone` | TEXT | | Phone number |
| `title` | TEXT | | Job title |
| `role_id` | UUID | FK -> roles(id) ON DELETE SET NULL | RBAC role assignment |
| `user_type` | TEXT | NOT NULL, CHECK IN ('internal', 'external') | Derived from role.user_type |
| `is_active` | BOOLEAN | DEFAULT TRUE | Soft delete flag |
| `onboarding_completed` | BOOLEAN | DEFAULT FALSE | Whether onboarding is complete |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Indexes
- `idx_user_profiles_onboarding` on `onboarding_completed`
- `idx_user_profiles_phone` on `phone`
- `idx_user_profiles_email` on `email`
- `idx_user_profiles_user_type` on `user_type`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Authenticated users can read profiles`: SELECT where auth.uid() IS NOT NULL
  - `Users can manage own profile`: ALL where auth.uid() = id
  - `Allow profile insert`: INSERT where auth.uid() IS NOT NULL
  - `is_internal()` helper function checks `user_type = 'internal'`

#### Notes
- `onboarding_completed` must be true for users to access the dashboard
- `is_active` = false effectively archives the user without deleting data
- `user_type` is set during auth callback based on the invitation's role.user_type
- Old `user_types` array and `alternate_email` columns are deprecated

---

### 6.1 `invitations`
Pre-registration table for users who haven't signed in yet. Claimed on first Google sign-in.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `email` | TEXT | UNIQUE, NOT NULL | Invited email (must match Google sign-in) |
| `display_name` | TEXT | NOT NULL | User's full name |
| `nick_name` | TEXT | | Optional short name |
| `role_id` | UUID | FK -> roles(id) ON DELETE SET NULL | Pre-assigned RBAC role (determines user_type) |
| `is_technician` | BOOLEAN | DEFAULT FALSE | Create technician record on claim |
| `skills` | TEXT[] | | Technician skills (if is_technician) |
| `job_title` | TEXT | | User's job title |
| `invited_by` | UUID | FK -> auth.users(id) ON DELETE SET NULL | Admin who created invitation |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Invitation creation time |
| `claimed_at` | TIMESTAMPTZ | | When user signed in and claimed |
| `claimed_by` | UUID | FK -> auth.users(id) ON DELETE SET NULL | Auth ID of claiming user |

#### Indexes
- `idx_invitations_email` on `email`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - Authenticated users can read/insert/update/delete invitations

#### Claim Flow
1. Admin creates invitation via Settings > Users > Invite User (role required)
2. User signs in with Google using invited email
3. Auth callback finds invitation, fetches `role.user_type`
4. Creates user_profile with `user_type` from role, + technician record if `is_technician`
5. Invitation marked as claimed (claimed_at, claimed_by set)
6. User redirected to 2-step onboarding (edit avatar, nick name, phone)

---

### 7. `office_staff` ⚠️ DEPRECATED
> **Note**: This table has been deprecated as of Migration 027. User titles are now stored in `user_profiles.title`. Internal users are identified by `user_profiles.user_type = 'internal'`.

**Replaced by**: Query `user_profiles WHERE user_type = 'internal'` for office staff.


---

### 8. `clients`
Corporate client entities that work orders can be assigned to.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL | Company name |
| `address` | TEXT | | Registered office address |
| `notes` | TEXT | | General notes about the client |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

#### Indexes
- `idx_clients_name` on `name`
- `idx_clients_created_at` on `created_at`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Allow all authenticated users to read/manage (permissive for now).

---

### 9. `project_managers`
External client contacts (Project Managers). Distinct from internal `office_staff`.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `client_id` | UUID | FK to clients(id), ON DELETE CASCADE | Associated client |
| `name` | TEXT | NOT NULL | Contact name |
| `email` | TEXT | | Email address |
| `phone` | TEXT | | Phone number |
| `user_profile_id` | UUID | FK to user_profiles(id), ON DELETE SET NULL | Link to auth account for portal access |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

#### Indexes
- `idx_project_managers_client_id` on `client_id`
- `idx_project_managers_name` on `name`
- `idx_project_managers_email` on `email`
- `idx_project_managers_user_profile_id` on `user_profile_id`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Allow all authenticated users to read/manage (permissive for now).

#### Notes
- When a `client` is deleted, all associated `project_managers` are automatically deleted (CASCADE).
- These are **external** contacts, not to be confused with internal `office_staff`.
- `user_profile_id` links PM to an auth account for client portal login (`/client-login`).


---

### 10. `roles`
Defines available user roles in the system. Each role specifies whether it's for internal or external users.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | UNIQUE, NOT NULL | Machine-readable name (e.g., 'super_admin') |
| `display_name` | TEXT | NOT NULL | Human-readable name (e.g., 'Super Admin') |
| `description` | TEXT | | Role description |
| `user_type` | TEXT | NOT NULL, CHECK IN ('internal', 'external') | Determines user access level |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

#### Notes
- `user_type` propagates to `user_profiles.user_type` when a user is assigned this role
- Internal roles: Super Admin, Admin, Technician, Project Coordinator, etc.
- External roles: Client, Vendor, Sub-contractor

---

### 11. `permissions`
Defines granular access capabilities.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | UNIQUE, NOT NULL | Permission key (e.g., 'users:read') |
| `description` | TEXT | | Description of the capability |
| `module` | TEXT | | Feature module (e.g., 'users', 'work_orders') |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

---

### 12. `role_permissions`
Junction table linking roles to permissions.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `role_id` | UUID | FK -> roles(id), ON DELETE CASCADE | Role ID |
| `permission_id` | UUID | FK -> permissions(id), ON DELETE CASCADE | Permission ID |
| **PK** | | (role_id, permission_id) | Composite Primary Key |

---

## Relationships

### Current Relationships
- `work_orders.uploaded_by` → `auth.users.id`
- `work_orders.client_id` → `clients.id` (SET NULL on delete)
- `work_orders.pm_id` → `project_managers.id` (SET NULL on delete)
- `work_order_files.work_order_id` → `work_orders.id` (CASCADE DELETE)
- `user_profiles.id` → `auth.users.id` (CASCADE DELETE)
- `project_managers.client_id` → `clients.id` (CASCADE DELETE)


### Planned Relationships (Future)
1. **Work Order Assignments**
   - `work_order_assignments` table
   - Links work_orders to technicians, equipment, and vehicles
   - Many-to-many relationships

2. **Equipment Assignments**
   - Track which technician has which equipment
   - `equipment.assigned_to` → `technicians.id`

3. **Vehicle Assignments**
   - Track which technician is using which vehicle
   - `vehicles.assigned_to` → `technicians.id`

---

## Storage

### Supabase Storage Buckets

#### `work-orders` Bucket
Stores uploaded work order files (PDFs, images).

**Configuration**:
- **Public**: Yes
- **File size limit**: Default (50MB)
- **Allowed MIME types**: 
  - `application/pdf`
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `image/webp`

**RLS Policies**:
```sql
-- Allow anyone to upload
CREATE POLICY "Allow all uploads to work-orders"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'work-orders');

-- Allow anyone to read
CREATE POLICY "Allow all reads from work-orders"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'work-orders');

-- Allow anyone to delete
CREATE POLICY "Allow all deletes from work-orders"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'work-orders');
```

**File Naming Convention**:
- Format: `{timestamp}_{random}.{extension}`
- Example: `1702234567890_abc123.pdf`

---

## Database Setup Scripts

### Enable UUID Extension
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Create All Tables
See `supabase_schema.sql` artifact for complete SQL script.

### Migration Strategy
1. Run schema creation in Supabase SQL Editor
2. Verify tables created with correct columns
3. Check indexes are in place
4. Test RLS policies
5. Create storage bucket manually
6. Apply storage policies

---

## Performance Considerations

### Indexes
All frequently queried columns have indexes:
- Email lookups (technicians)
- Status filtering (equipment, vehicles)
- License plate lookups (vehicles)
- Work order processing status
- Created_at for chronological sorting

### Query Optimization
- Use `SELECT *` sparingly in production
- Filter by indexed columns when possible
- Use pagination for large result sets
- Consider materialized views for complex queries

---

## Security

### Row Level Security (RLS)
- Currently permissive for development
- **Production**: Enable strict RLS policies
  - Users can only see/modify their own data
  - Admin role for full access
  - Technicians can see assigned work orders

### Storage Security
- Files stored in Supabase Storage
- Public read access for processed files
- Authenticated upload/delete
- **Production**: Implement signed URLs for sensitive files

---

## Backup & Recovery

### Recommended Strategy
1. **Daily Backups**: Automated via Supabase
2. **Point-in-Time Recovery**: Available on paid plans
3. **Export Scripts**: Regular exports to CSV/JSON
4. **Version Control**: Keep schema in git

### Data Retention
- Work orders: Indefinite (archive after 1 year)
- Technician records: Until employment ends
- Equipment/Vehicle records: Until disposal
- Analysis data: Same as work order

---

## Phase 12: Advanced Work Order Schema

### New Tables

#### 1. `job_types`
Categorizes work orders.
- `id` (UUID, PK)
- `name` (TEXT, Unique)
- `description` (TEXT)
- `created_at` (TIMESTAMPTZ)

#### 2. `work_order_assignments`
Junction table for assigning multiple technicians to a work order.
- `id` (UUID, PK)
- `work_order_id` (UUID, FK -> work_orders)
- `user_profile_id` (UUID, FK -> user_profiles)
- `assigned_at` (TIMESTAMPTZ)
- `notes` (TEXT)

#### 3. `work_order_shipments`
Tracks shipments associated with work orders.
- `id` (UUID, PK)
- `work_order_id` (UUID, FK -> work_orders)
- `tracking_id` (TEXT)
- `contents` (TEXT)
- `status_location` (TEXT) - e.g., 'In Transit', 'Received'
- `received_by_id` (UUID) - User ID of receiver
- `received_by_type` (TEXT) - 'technician' or 'office_staff'
- `received_at` (TIMESTAMPTZ)
- `receipt_photos` (TEXT[]) - URLs to storage
- `notes` (TEXT)

### Updates to `work_orders` table
- `work_order_number` (TEXT) - Readable ID
- `job_type_id` (UUID, FK -> job_types)
- `site_address` (TEXT)
- `planned_date` (DATE)
- `work_order_date` (DATE)
- `skills_required` (TEXT[])
- `permits_required` (TEXT[])
- `equipment_required` (TEXT[])
- `materials_required` (TEXT[])
- `recommended_techs` (INTEGER)

### Storage
- **Bucket**: `shipment-photos` (Public Read)

---

## Phase 16: Task Comments System

### New Tables

#### 1. `work_order_task_comments`
Stores threaded comments on individual work order tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `task_id` | UUID | NOT NULL, FK -> work_order_tasks (ON DELETE CASCADE) | Parent task |
| `user_id` | UUID | NOT NULL, FK -> user_profiles (ON DELETE CASCADE) | Comment author |
| `content` | TEXT | NOT NULL | Comment text content |
| `attachments` | TEXT[] | DEFAULT '{}' | Array of attachment URLs (max 5) |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

##### Indexes
- `idx_task_comments_task_id` on `task_id`
- `idx_task_comments_user_id` on `user_id`
- `idx_task_comments_created_at` on `created_at DESC`

##### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Allow all reads on task_comments`: SELECT for authenticated
  - `Allow authenticated inserts on task_comments`: INSERT for authenticated
  - `Allow users to update own task_comments`: UPDATE for authenticated (user_id = auth.uid())
  - `Allow users to delete own task_comments`: DELETE for authenticated (user_id = auth.uid())

#### 2. `task_comment_mentions`
Junction table for @mentions in task comments (for future notifications).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `comment_id` | UUID | NOT NULL, FK -> work_order_task_comments (ON DELETE CASCADE) | Parent comment |
| `mentioned_user_id` | UUID | FK -> user_profiles (ON DELETE CASCADE) | Mentioned user (office staff/WO owner) |

| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |



##### Indexes
- `idx_task_comment_mentions_comment_id` on `comment_id`
- `idx_task_comment_mentions_user_id` on `mentioned_user_id`


##### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Allow all reads on task_comment_mentions`: SELECT for authenticated
  - `Allow authenticated inserts on task_comment_mentions`: INSERT for authenticated
  - Deletes handled by CASCADE from parent comment

### Storage
Attachments are stored in the existing `work-orders` bucket under path:
- `task-comments/{taskId}/{timestamp}_{randomId}.{ext}`
- **Max file size**: 25MB
- **Allowed types**: PDF, JPG, JPEG, PNG, GIF, WEBP

---

## Phase 17: Task Categories and Tags

### New Tables

#### 1. `work_order_categories`
Categories scoped to individual work orders for task organization.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | NOT NULL, FK -> work_orders (ON DELETE CASCADE) | Parent work order |
| `name` | TEXT | NOT NULL | Category name |
| `color` | TEXT | DEFAULT '#3B82F6' | Hex color for display |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

**Unique constraint**: `(work_order_id, name)` prevents duplicate category names within a work order.

##### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Full CRUD for authenticated users

#### 2. `task_tags`
Global tags shared across all work orders and tasks.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `name` | TEXT | NOT NULL, UNIQUE | Tag name (global, no duplicates) |
| `color` | TEXT | DEFAULT '#10B981' | Hex color for display |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

##### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Full CRUD for authenticated users

#### 3. `task_tag_assignments`
Junction table connecting tasks to tags (many-to-many).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `task_id` | UUID | NOT NULL, FK -> work_order_tasks (ON DELETE CASCADE) | Task being tagged |
| `tag_id` | UUID | NOT NULL, FK -> task_tags (ON DELETE CASCADE) | Tag applied |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Assignment timestamp |

**Unique constraint**: `(task_id, tag_id)` prevents duplicate tag assignments.

##### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: SELECT, INSERT, DELETE for authenticated users

### Updates to `work_order_tasks` table
- Added `category_id` (UUID, FK -> work_order_categories, ON DELETE SET NULL)

---

### 17. `work_order_team`
Office staff team assignments for work orders.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | NOT NULL, FK → work_orders (ON DELETE CASCADE) | Work order reference |
| `user_profile_id` | UUID | NOT NULL, FK → user_profiles (ON DELETE CASCADE) | Office staff user |
| `added_at` | TIMESTAMPTZ | DEFAULT NOW() | Assignment timestamp |

#### Indexes
- `idx_work_order_team_work_order_id` on `work_order_id`
- `idx_work_order_team_user_profile_id` on `user_profile_id`

#### Constraints
- Unique constraint on `(work_order_id, user_profile_id)`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Allow authenticated reads`: SELECT for authenticated users
  - `Allow authenticated inserts`: INSERT for authenticated users

---

### 18. `work_order_chat_messages`
Team chat messages for work orders with real-time support.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | NOT NULL, FK → work_orders (ON DELETE CASCADE) | Work order reference |
| `user_profile_id` | UUID | NOT NULL, FK → user_profiles (ON DELETE CASCADE) | Message author |
| `message` | TEXT | NOT NULL, CHECK (char_length <= 2000) | Message content |
| `file_references` | UUID[] | DEFAULT '{}' | Array of work_order_files.id |
| `edited_at` | TIMESTAMPTZ | NULL | Set when message is edited |
| `is_deleted` | BOOLEAN | DEFAULT FALSE | Soft delete flag |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Message timestamp |

#### Indexes
- `idx_chat_messages_work_order_id` on `work_order_id`
- `idx_chat_messages_created_at` on `(work_order_id, created_at)`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Team members can view chat messages`: SELECT for authenticated users who are WO team members
  - `Team members can send chat messages`: INSERT for authenticated team members (author must be self)
  - `Message author can edit their messages`: UPDATE for message author only
  - `Message author can delete their messages`: DELETE for message author only

#### Helper Function
```sql
is_work_order_team_member(wo_id UUID, user_id UUID) RETURNS BOOLEAN
```
Returns true if user is WO owner, in work_order_team, or in work_order_assignments.

#### Real-time
- Enabled via `ALTER PUBLICATION supabase_realtime ADD TABLE work_order_chat_messages`
