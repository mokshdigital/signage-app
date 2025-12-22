# Work Order Field Additions (COMPLETED)

Add new scheduling and review fields to work orders, plus convert `planned_date` to an array.

---

## Implemented Changes

### 1. Database Migration
**File:** `database_migrations/018_wo_scheduling_fields.sql`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `estimated_days` | `integer` | `null` | Days needed for job |
| `scheduling_notes` | `text` | `null` | Special scheduling needs (weekend, after hrs) |
| `review_needed` | `boolean` | `true` | Review flag |
| `planned_dates` | `date[]` | `null` | **REPLACES** `planned_date` |

```sql
-- Add new columns
ALTER TABLE work_orders ADD COLUMN estimated_days integer;
ALTER TABLE work_orders ADD COLUMN scheduling_notes text;
ALTER TABLE work_orders ADD COLUMN review_needed boolean DEFAULT true;
ALTER TABLE work_orders ADD COLUMN planned_dates date[];

-- Migrate existing planned_date to array
UPDATE work_orders 
SET planned_dates = ARRAY[planned_date]::date[] 
WHERE planned_date IS NOT NULL;

-- Drop old column (optional - can keep for backwards compatibility)
-- ALTER TABLE work_orders DROP COLUMN planned_date;
```

---

### 2. TypeScript Types
**File:** `types/database.ts`

```typescript
export interface WorkOrder {
    // ... existing fields ...
    
    // New scheduling fields
    estimated_days: number | null;
    scheduling_notes: string | null;
    review_needed: boolean;
    
    // Change planned_date to array
    planned_dates: string[] | null;  // Array of DATE ISO strings
    planned_date: string | null;     // Keep for backwards compat (deprecated)
}
```

---

### 3. WorkOrderReviewModal (Step 2 after upload)
**File:** `components/work-orders/WorkOrderReviewModal.tsx`

**Add fields:**
- **Est. Days** - Number input (short label)
- **Scheduling Notes** - Textarea (e.g., "Weekend only", "After hours")
- **Planned Dates** - Multi-date picker (array)

**Remove:** Old single planned_date field (if present)

---

### 4. WorkOrderEditModal
**File:** `components/work-orders/WorkOrderEditModal.tsx`

Same fields as #3 - ensure both modals stay in sync.

---

### 5. WorkOrderDetailHeader - Review Badge
**File:** `components/work-orders/WorkOrderDetailHeader.tsx`

**Logic:**
```typescript
const needsReview = 
    workOrder.review_needed || 
    !workOrder.client_id || 
    !workOrder.pm_id || 
    !workOrder.owner_id;
```

**UI:**
- If `needsReview` is true, show a **red badge**: `⚠ Review Needed`
- On click, open a small dialog listing what's missing:
  - ❌ Client not assigned
  - ❌ Contact/PM not assigned
  - ❌ Owner not assigned
  - ❌ Manual review flag set

---

### 6. Services Layer
**File:** `services/work-orders.service.ts`

Update `update()` method to handle new fields.

---

## Work Order Checklist
- [x] Create migration: `018_wo_scheduling_fields.sql`
- [x] Run migration on Supabase
- [x] Update `types/database.ts`
- [x] Update `WorkOrderReviewModal.tsx` with new fields
- [x] Update `WorkOrderEditModal.tsx` with new fields
- [x] Add review badge + dialog to `WorkOrderDetailHeader.tsx`
- [x] Update services layer if needed
- [x] Test and verify
