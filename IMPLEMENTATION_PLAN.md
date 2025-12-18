
# Work Order Search & Filter Implementation Plan

## Goal
Add comprehensive search and multi-filtering capabilities to the Work Orders tab and reorder columns as requested.

## Proposed Changes

### [WorkOrdersPage](file:///f:/Tops%20Lighting/signage-app/signage-app/app/dashboard/work-orders/page.tsx)

#### 1. Add State
- `searchTerm` (string): Text search across multiple text fields.
- `filters` (object):
  - `status`: 'all' | 'analyzed' | 'pending'
  - `jobType`: string (id) | 'all'
  - `client`: string (id) | 'all'
  - `date`: string (date string) | ''

#### 2. Implement Filter Logic
- Create `filteredOrders` useMemo that filters the `workOrders` based on:
  - **Search**: Case-insensitive match against WO#, Site Address, Client Name, and Uploaded By.
  - **Status**: Match `order.processed` (bool).
  - **Job Type**: Match `order.job_type_id`.
  - **Client**: Match `order.client_id`.
  - **Date**: Match to `created_at` (compare date part only).

#### 3. Data Fetching
- Need to fetch `jobTypes` and `clients` on load to populate the filter dropdowns (currently `clients` are only fetched when opening the assign modal). Move `fetchClients` to `useEffect` on mount.

#### 4. Update UI
- Add a filter toolbar above the generic Search Bar.
  - **Row 1**: Search Bar (full width or distinct).
  - **Row 2 (Filters)**: Flex container with dropdowns for:
    - Status (Analyzed/Pending)
    - Job Type (Dynamic list)
    - Client (Dynamic list)
    - Date Picker (Native date input)
    - "Clear Filters" button

#### 5. Reorder Columns
- Move the "Uploaded Date" column object to the very end of the `columns` array.

## Verification Plan
- **Manual Verification**:
  - Test each filter individually (e.g., select a Job Type -> see only matching orders).
  - Test date filter (pick a date -> see orders from that day).
  - Test combinations (e.g., Client X + Pending status).
  - Verify "Uploaded Date" is the last column.
