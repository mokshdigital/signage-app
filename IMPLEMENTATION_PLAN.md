
# Sub-Phase B: Execution, AI-Tasking & Checklist Engine Implementation Plan

## Goal
Implement a hierarchical Task and Checklist system within Work Orders, including AI-automated task extraction, a centralized Checklist Template library, and granular technician accountability.

## Proposed Changes

### 1. Database Schema
#### [NEW] [011_tasks_and_checklists.sql](file:///f:/Tops%20Lighting/signage-app/signage-app/database_migrations/011_tasks_and_checklists.sql)
- Create `checklist_templates` (id, name, description)
- Create `checklist_template_items` (id, template_id, content, sort_order)
- Create `work_order_tasks` (id, work_order_id, name, status, priority, due_date, block_reason, assigned_to_ids)
  - `status` enum: 'Pending', 'In Progress', 'On Hold', 'Blocked', 'Done'
  - `priority` enum: 'Low', 'Medium', 'High', 'Emergency'
- Create `task_checklists` (id, task_id, content, is_completed, completed_by_id, completed_at)
- Create `task_assignments` (id, task_id, technician_id) - *Optionally, or array in work_order_tasks if simple. Let's use a junction table for proper normalization if M:N, or just simple column if 1:N. The requirement says "Restricted Assignments", likely M:N or 1:N. "assigned_to_ids" implies multiple? The prompt says "assigned to technicians" (plural). Let's assume M:N for flexibility or just use a specific assignee if it's 1:1. The prompt mentions "Restricted Assignments: Tasks can only be assigned to technicians...". I will implement a junction table `work_order_task_assignments` for M:N assignment.*

### 2. TypeScript Types
#### [MODIFY] [database.ts](file:///f:/Tops%20Lighting/signage-app/signage-app/types/database.ts)
- Add interfaces:
  - `ChecklistTemplate`
  - `ChecklistTemplateItem`
  - `WorkOrderTask`
  - `TaskChecklistItem`
  - `WorkOrderTaskAssignment`

### 3. Service Layer
#### [MODIFY] [work-orders.service.ts](file:///f:/Tops%20Lighting/signage-app/signage-app/services/work-orders.service.ts)
- Add methods for:
  - CRUD `work_order_tasks`
  - CRUD `task_checklists` (including toggling completion with `completed_by_id`)
  - CRUD `checklist_templates` & items (Might be better in a separate `checklist.service.ts` or `settings.service.ts`? The user said `work-orders.service.ts`, but Templates in Settings might warrant a `checklist-templates.service.ts`. I'll put Template logic in a new service `checklist-templates.service.ts` to keep it clean, or stick to `work-orders` if strictly requested. The user said "services/work-orders.service.ts (Task/Checklist CRUD)". I'll put specific work order task/checklist stuff there. I'll put Templates in `checklist-templates.service.ts` if I can, or just bundle if small. Let's separate Templates to `checklist-templates.service.ts` for cleaner architecture, and Task/Items in `work-orders.service.ts`.)

### 4. Settings UI
#### [NEW] [page.tsx](file:///f:/Tops%20Lighting/signage-app/signage-app/app/dashboard/settings/checklist-templates/page.tsx)
- Tab for Checklist Templates.
- Master-detail view or List + Modal.
- Create Template -> Add Items.

#### [MODIFY] [page.tsx](file:///f:/Tops%20Lighting/signage-app/signage-app/app/dashboard/settings/page.tsx)
- Add "Checklist Templates" tab to the Settings layout.

### 5. Work Order UI
#### [MODIFY] [page.tsx](file:///f:/Tops%20Lighting/signage-app/signage-app/app/dashboard/work-orders/[id]/page.tsx)
- Add "Execution & Tasks" section.
- "Add Task" button (Manual).
- List of Tasks.
- Task Card/Row:
  - Header: Name, Priority Badge, Status Dropdown.
  - Body: Due Date, Assignees (filtered by WO technicians).
  - Footer: Checklist Items (Progress Bar).
  - Actions: "Apply Template", "Add Item".
- Blocked Status logic: Show/Hide `block_reason` input.

### 6. AI Integration
#### [MODIFY] [route.ts](file:///f:/Tops%20Lighting/signage-app/signage-app/app/api/process-work-order/route.ts)
- Update Gemini System Instruction to extract `scope_of_work` (summary) and `suggested_tasks` (array).
- On success, insert `suggested_tasks` into `work_order_tasks` with status 'Pending'.

## Verification Plan
1. **Schema**: Run SQL, check tables.
2. **Settings**: Create a template with 3 items. Verify persistence.
3. **AI**: Process a sample PDF. Check if tasks are auto-created.
4. **Task UI**:
   - Create a manual task.
   - Assign to a technician (ensure only WO-assigned techs appear).
   - Change status to Blocked -> Enter reason.
   - Apply the created template -> Verify items added.
   - Check off an item -> Verify Progress Bar updates and `user_id` is saved.
