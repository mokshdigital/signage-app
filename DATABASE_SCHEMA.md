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
| `processed` | BOOLEAN | DEFAULT FALSE | Whether AI has processed this order |
| `analysis` | JSONB | | AI-extracted structured data from all files |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

#### Indexes
- `idx_work_orders_uploaded_by` on `uploaded_by`
- `idx_work_orders_processed` on `processed`
- `idx_work_orders_created_at` on `created_at`

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
Stores multiple files associated with each work order (work orders, plans, specifications, site photos, etc.).

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT uuid_generate_v4() | Unique identifier |
| `work_order_id` | UUID | REFERENCES work_orders(id) ON DELETE CASCADE | Associated work order |
| `file_url` | TEXT | NOT NULL | Supabase Storage URL to the file |
| `file_name` | TEXT | | Original filename |
| `file_size` | INTEGER | | File size in bytes |
| `mime_type` | TEXT | | MIME type of the file |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Upload timestamp |

#### Indexes
- `idx_work_order_files_work_order_id` on `work_order_id`

#### Row Level Security (RLS)
- **Enabled**: No (disabled for development)
- **Cascade Delete**: When a work order is deleted, all associated files are automatically deleted from the database (CASCADE constraint)

#### Supported File Types
- **PDFs**: Work orders, specifications, plans
- **Images**: JPG, JPEG, PNG, GIF, WEBP (site photos, diagrams)
- **Maximum Files**: Unlimited (UI restricted)


---

### 6. `user_profiles`
Stores extended user profile information collected during onboarding.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | User's auth ID |
| `display_name` | TEXT | NOT NULL | User's display name |
| `avatar_url` | TEXT | | Profile picture URL |
| `phone` | TEXT | | Phone number |
| `alternate_email` | TEXT | | Secondary email address |
| `title` | TEXT | | Role/title (set by administrator) |
| `onboarding_completed` | BOOLEAN | DEFAULT FALSE | Whether onboarding is complete |
| `created_at` | TIMESTAMP | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMP | DEFAULT NOW() | Last update timestamp |

#### Indexes
- `idx_user_profiles_onboarding` on `onboarding_completed`
- `idx_user_profiles_phone` on `phone`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**:
  - `Users can view own profile`: SELECT where auth.uid() = id
  - `Users can create own profile`: INSERT where auth.uid() = id
  - `Users can update own profile`: UPDATE where auth.uid() = id
  - `Service role has full access`: ALL for service_role

#### Notes
- The `title` field is intended to be set by administrators only
- `onboarding_completed` must be true for users to access the dashboard
- Auto-updates `updated_at` timestamp on any updates via trigger

---

### 7. `office_staff`
Directory of office staff members.

#### Columns
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier |
| `name` | TEXT | NOT NULL | Staff member name |
| `email` | TEXT | | Email address |
| `phone` | TEXT | | Contact number |
| `title` | TEXT | | Job title |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Allow all authenticated users to read/manage (permissive for now).


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
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

#### Indexes
- `idx_project_managers_client_id` on `client_id`
- `idx_project_managers_name` on `name`
- `idx_project_managers_email` on `email`

#### Row Level Security (RLS)
- **Enabled**: Yes
- **Policies**: Allow all authenticated users to read/manage (permissive for now).

#### Notes
- When a `client` is deleted, all associated `project_managers` are automatically deleted (CASCADE).
- These are **external** contacts, not to be confused with internal `office_staff`.


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
- `technician_id` (UUID, FK -> technicians)
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

### Storage
- **Bucket**: `shipment-photos` (Public Read)
