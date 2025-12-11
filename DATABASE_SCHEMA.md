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
- **Maximum Files**: 10 files per work order


---

## Relationships

### Current Relationships
Currently, there are no foreign key relationships between tables (except `work_orders.uploaded_by` → `auth.users.id`).

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
