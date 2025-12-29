# Permissions & Access Control Documentation

> **Purpose**: This document provides a comprehensive reference for all permissions, roles, and access control mechanisms across the Tops Lighting Signage Dashboard application. Agents should review this document at the start and end of each session to maintain consistency with the permission model.

---

## Table of Contents
1. [Quick Reference](#quick-reference)
2. [User Types](#user-types)
3. [System Roles](#system-roles)
4. [Permissions Catalog](#permissions-catalog)
5. [UI Access Control](#ui-access-control)
6. [Database Row Level Security (RLS)](#database-row-level-security-rls)
7. [Route Protection](#route-protection)
8. [Client Hub Access](#client-hub-access)
9. [File Visibility Control](#file-visibility-control)
10. [Implementation Patterns](#implementation-patterns)
11. [Adding New Permissions](#adding-new-permissions)

---

## Quick Reference

### Key Files
| File | Purpose |
|------|---------|
| `hooks/usePermissions.tsx` | Permission context provider and hooks |
| `services/rbac.service.ts` | Role & permission CRUD operations |
| `types/rbac.ts` | TypeScript types for RBAC |
| `lib/supabase/middleware.ts` | Route-level access control |
| `database_migrations/003_rbac_schema.sql` | Core RBAC schema |
| `database_migrations/030_client_hub_schema.sql` | Client Hub access function |

### Quick Check Functions
```typescript
// In React components
const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions();

// Single permission check
if (hasPermission('work_orders:manage')) { /* ... */ }

// Any of multiple permissions
if (hasAnyPermission(['roles:manage', 'users:manage', 'settings:manage'])) { /* ... */ }

// All permissions required
if (hasAllPermissions(['work_orders:read', 'work_orders:update'])) { /* ... */ }
```

---

## User Types

The system has two fundamental user types that determine access scope:

### Internal Users (`user_type: 'internal'`)
- **Who**: Company employees (office staff, technicians, supervisors, admins)
- **Auth Method**: Google OAuth via `/login`
- **Dashboard**: `/dashboard/*`
- **Capabilities**: Full internal dashboard access based on assigned role permissions

### External Users (`user_type: 'external'`)
- **Who**: Client contacts (Project Managers), vendors, subcontractors
- **Auth Method**: Email/Password via `/client-login`
- **Dashboard**: `/client-dashboard`
- **Capabilities**: Limited to viewing their assigned work orders and client hub chat

### User Type Determination
User type is **derived from the assigned role**, not set directly:
- User assigned to `Admin` role → `user_type: 'internal'`
- User assigned to `Client` role → `user_type: 'external'`

---

## System Roles

### Internal Roles
| Role | Slug | Description | Key Capabilities |
|------|------|-------------|------------------|
| **Super Admin** | `super_admin` | Full system access | All permissions, cannot be restricted |
| **Admin** | `admin` | Administrative access | User management, settings, roles |
| **Supervisor** | `supervisor` | Oversee operations | Assign technicians, approve work |
| **Project Coordinator** | `project_coordinator` | Manage WOs & clients | Work order CRUD, client communication |
| **Technician** | `technician` | Field worker | View/complete assigned work orders |

### External Roles
| Role | Slug | Description | Key Capabilities |
|------|------|-------------|------------------|
| **Client** | `client` | External customer | View their work orders, client hub chat |
| **Sub-contractor** | `subcontractor` | External field worker | View assigned work orders |
| **Vendor** | `vendor` | External vendor | Limited shipment access |

### Role Properties
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,        -- Slug: 'super_admin'
    display_name TEXT NOT NULL,       -- Display: 'Super Admin'
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE,  -- System roles cannot be deleted
    user_type TEXT NOT NULL           -- 'internal' | 'external'
);
```

---

## Permissions Catalog

### Permission Format
All permissions follow the format: `{resource}:{action}`

### Core Permissions (42 total)

#### Users Resource
| Permission | Description |
|------------|-------------|
| `users:create` | Create new users |
| `users:read` | View user list and profiles |
| `users:update` | Update user information |
| `users:delete` | Delete users |
| `users:manage` | Full control over users (implies all above) |

#### Roles Resource
| Permission | Description |
|------------|-------------|
| `roles:create` | Create new roles |
| `roles:read` | View roles |
| `roles:update` | Update role permissions |
| `roles:delete` | Delete non-system roles |
| `roles:manage` | Full control over roles |

#### Work Orders Resource
| Permission | Description |
|------------|-------------|
| `work_orders:create` | Create work orders |
| `work_orders:read` | View work orders |
| `work_orders:update` | Update work orders |
| `work_orders:delete` | Delete work orders |
| `work_orders:manage` | Full control over work orders |
| `work_orders:assign` | Assign work orders to technicians |

#### Technicians Resource
| Permission | Description |
|------------|-------------|
| `technicians:create` | Add new technicians |
| `technicians:read` | View technician list |
| `technicians:update` | Update technician info |
| `technicians:delete` | Remove technicians |
| `technicians:manage` | Full control over technicians |

#### Equipment Resource
| Permission | Description |
|------------|-------------|
| `equipment:create` | Add new equipment |
| `equipment:read` | View equipment inventory |
| `equipment:update` | Update equipment status |
| `equipment:delete` | Remove equipment |
| `equipment:manage` | Full control over equipment |

#### Vehicles Resource
| Permission | Description |
|------------|-------------|
| `vehicles:create` | Add new vehicles |
| `vehicles:read` | View vehicle fleet |
| `vehicles:update` | Update vehicle info |
| `vehicles:delete` | Remove vehicles |
| `vehicles:manage` | Full control over vehicles |

#### Clients Resource
| Permission | Description |
|------------|-------------|
| `clients:create` | Create new client records |
| `clients:read` | View client list and details |
| `clients:update` | Update client info and manage contacts |
| `clients:delete` | Delete clients and contacts |
| `clients:manage` | Full control (includes portal account creation) |

#### Reports Resource
| Permission | Description |
|------------|-------------|
| `reports:read` | View reports and analytics |
| `reports:create` | Generate reports |
| `reports:manage` | Full control over reports |

#### Settings Resource
| Permission | Description |
|------------|-------------|
| `settings:read` | View system settings |
| `settings:update` | Update system settings |
| `settings:manage` | Full control over settings |
| `settings:manage_company` | Manage company information and branding |

#### Dashboard Resource
| Permission | Description |
|------------|-------------|
| `dashboard:read` | Access main dashboard |

#### Timesheets Resource
| Permission | Description |
|------------|-------------|
| `timesheets:log_own` | Create and edit own time entries (Draft/Rejected only) |
| `timesheets:submit_own` | Submit own timesheets for approval |
| `timesheets:view_own` | View own timesheet history |
| `timesheets:request_past_day` | Request to edit/log past days beyond today |
| `timesheets:approve` | Approve or reject timesheets (Supervisors/Admins) |
| `timesheets:view_all` | View all employees' timesheets (Admin "All Timesheets" tab) |
| `timesheets:process` | Mark approved timesheets as processed for payroll |

#### Roles and Users Resources
| Permission | Description |
|------------|-------------|
| `roles:manage` | Full control over role definitions and permission assignments |
| `users:manage` | Manage user accounts and role assignments |

> **Note**: Migration `036_fix_missing_role_permissions.sql` added `roles:manage` and `users:manage` to `super_admin` and `admin` roles. These permissions were created but never assigned in the original migration.

### Extended Permissions

#### File Management (Migration 017)
| Permission | Description |
|------------|-------------|
| `files:manage_office` | Manage office-level file categories |
| `files:manage_field` | Manage field-level file categories |
| `files:view_office_only` | View office-only file categories |

#### Client Hub (Migration 030)
| Permission | Description |
|------------|-------------|
| `client_hub:manage_contacts` | Add or remove additional client contacts on work orders |

---

## UI Access Control

### Sidebar Navigation
Navigation items are filtered based on permissions in `components/layout/Sidebar.tsx`:

```typescript
const mainNavItems: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', permission: 'dashboard:read' },
    { name: 'People', href: '/dashboard/people', icon: '👥', permission: 'technicians:read' },
    { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧', permission: 'equipment:read' },
    { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗', permission: 'vehicles:read' },
    { name: 'Clients', href: '/dashboard/clients', icon: '🏢', permission: 'work_orders:read' },
    { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋', permission: 'work_orders:read' },
    { 
        name: 'Settings', 
        href: '/dashboard/settings', 
        icon: '⚙️', 
        permission: ['roles:manage', 'users:manage', 'settings:manage'] // Any of these
    },
];
```

### Settings Tabs
Settings sub-navigation is filtered in `app/dashboard/settings/layout.tsx`:

| Tab | URL | Required Permission |
|-----|-----|---------------------|
| Company Info | `/dashboard/settings/company` | `settings:manage_company` |
| Roles | `/dashboard/settings/roles` | `roles:manage` |
| Users | `/dashboard/settings/users` | `users:manage` |
| Job Types | `/dashboard/settings/job-types` | `settings:manage` |
| Checklist Templates | `/dashboard/settings/checklist-templates` | `settings:manage` |

### Component-Level Protection

#### RequirePermission Component
```tsx
import { RequirePermission } from '@/hooks/usePermissions';

<RequirePermission 
    permission="work_orders:delete" 
    fallback={<span>Access Denied</span>}
>
    <DeleteButton />
</RequirePermission>

// Multiple permissions (any one required)
<RequirePermission permission={['roles:manage', 'users:manage']}>
    <AdminSection />
</RequirePermission>
```

#### Hook-based Protection
```tsx
const { hasPermission } = usePermissions();

{hasPermission('users:manage') && (
    <button onClick={handleDelete}>Delete User</button>
)}
```

---

## Database Row Level Security (RLS)

### Helper Functions

#### `is_internal()`
Checks if current user is an internal user:
```sql
CREATE OR REPLACE FUNCTION public.is_internal()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND user_type = 'internal'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### `can_access_client_hub(wo_id UUID)`
Determines if user can access Client Hub for a work order:
```sql
-- Returns TRUE if user is:
-- 1. WO owner
-- 2. Internal team member (non-technician) in work_order_team
-- 3. Primary PM (via work_orders.pm_id → project_managers.user_profile_id)
-- 4. Additional PM in work_order_client_access
```

### RLS Policies by Table

#### `work_orders`
- **Internal users can view all work orders**: `is_internal()`
- **Internal users can manage all work orders**: `is_internal()`

#### `clients`
- **Internal users can manage clients**: `is_internal()`

#### `user_profiles`
- **Internal users can view all profiles**: `is_internal()`
- **Users can manage own profile**: `auth.uid() = id`

#### `roles`, `permissions`, `role_permissions`
- **Authenticated users can read**: All authenticated users
- **Service role can manage**: Only service role

#### `work_order_client_access`
- All operations use `can_access_client_hub(work_order_id)`

#### `work_order_client_chat`
- SELECT/INSERT use `can_access_client_hub(work_order_id)`
- UPDATE limited to message author (`sender_id = auth.uid()`)

#### `work_order_chat_messages` (Team Chat)
- Uses `is_work_order_team_member(wo_id, user_id)` function

---

## Route Protection

### Middleware (`lib/supabase/middleware.ts`)

| Route | Protection Logic |
|-------|------------------|
| `/dashboard/*` | Auth required + `onboarding_completed = true` |
| `/client-dashboard` | Auth required + `user_type = 'external'` + `is_active = true` |
| `/onboarding` | Auth required + redirects away if onboarding completed |
| `/login` | Redirects authenticated users to dashboard |
| `/client-login` | Redirects authenticated external users to client-dashboard |

### Authentication Flows

#### Internal Users
```
/login → Google OAuth → /auth/callback → /onboarding (if new) → /dashboard
```

#### External Users (Client Portal)
```
/client-login → Email/Password → /client-dashboard
```

---

## Client Hub Access

The Client Hub is a client-facing communication channel with specific access rules:

### Who Can Access Client Hub

| User Type | Condition | Access Level |
|-----------|-----------|--------------|
| WO Owner | `work_orders.owner_id = auth.uid()` | Full access |
| Internal Team (non-technician) | In `work_order_team` + role ≠ 'technician' | Full access |
| Primary PM | `work_orders.pm_id` → `project_managers.user_profile_id` | Full access |
| Additional PM | Entry in `work_order_client_access` | Full access |
| Technicians | - | ❌ Access Restricted |

### Client Hub Features
- Real-time chat with file attachments
- Add/remove additional client contacts (requires `client_hub:manage_contacts` permission)
- View contact hierarchy (Primary PM badge)

---

## File Visibility Control

### `is_client_visible` Flag
Work order files have a visibility flag for client portal access:

```sql
-- In work_order_files table
is_client_visible BOOLEAN DEFAULT FALSE
```

### Visibility Management
- Internal users can toggle visibility in Client Hub tab
- Only `is_client_visible = TRUE` files appear in Client Portal
- Controlled via `ClientFilesManager` component

---

## Implementation Patterns

### Adding Permission Check to a Page

```tsx
// app/dashboard/settings/users/page.tsx
'use client';

import { usePermissions } from '@/hooks/usePermissions';

export default function UsersPage() {
    const { hasPermission, isLoading } = usePermissions();
    
    if (isLoading) return <LoadingSpinner />;
    
    if (!hasPermission('users:manage')) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
                <p className="text-gray-600">You dont have permission to manage users.</p>
            </div>
        );
    }
    
    return (
        // Page content
    );
}
```

### Adding Permission Check to a Service Call

```typescript
// services/example.service.ts
import { getCurrentUserPermissions } from './rbac.service';

export async function deleteItem(id: string) {
    const permissions = await getCurrentUserPermissions();
    if (!permissions.includes('items:delete') && !permissions.includes('items:manage')) {
        throw new Error('Permission denied');
    }
    // Proceed with deletion
}
```

### Checking Multiple Permissions in UI

```tsx
const { hasAnyPermission } = usePermissions();

// Show Settings nav item if user has ANY of these permissions
const canAccessSettings = hasAnyPermission(['roles:manage', 'users:manage', 'settings:manage']);
```

---

## Adding New Permissions

### Step 1: Database Migration
Create a new migration file (e.g., `database_migrations/032_new_permission.sql`):

```sql
-- Add new permission
INSERT INTO permissions (name, description, resource, action)
VALUES ('resource:action', 'Description of the permission', 'resource', 'action')
ON CONFLICT (name) DO NOTHING;

-- Grant to super_admin automatically
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'super_admin' AND p.name = 'resource:action'
ON CONFLICT DO NOTHING;

-- Optionally grant to other roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name = 'resource:action'
ON CONFLICT DO NOTHING;
```

### Step 2: Update Types (Optional)
If the resource is new, add it to `types/rbac.ts`:

```typescript
export type PermissionResource =
    | 'users'
    | 'roles'
    // ... existing resources
    | 'new_resource';  // Add new resource here
```

### Step 3: Update UI Display Names (Optional)
If adding a new resource group, update `services/rbac.service.ts`:

```typescript
const resourceDisplayNames: Record<string, string> = {
    users: 'User Management',
    // ... existing mappings
    new_resource: 'New Resource Display Name',
};
```

### Step 4: Use in Components
```tsx
const { hasPermission } = usePermissions();

if (hasPermission('resource:action')) {
    // Render protected content
}
```

---

## Checklist for Permission Changes

When modifying permissions, verify:

- [ ] Migration file created and tested locally
- [ ] Super Admin automatically receives new permission
- [ ] Other appropriate roles receive permission
- [ ] UI components updated with permission checks
- [ ] Settings tabs visibility updated (if applicable)
- [ ] Sidebar navigation updated (if applicable)
- [ ] TypeScript types updated (if new resource)
- [ ] Display names updated in `getPermissionsGrouped()` (if new resource)
- [ ] This document updated to reflect changes

---

## Current Permission Assignments by Role

### super_admin
**All permissions** - automatically granted all existing and new permissions

### admin
- All `users:*` permissions
- All `roles:*` permissions
- All `clients:*` permissions
- `settings:manage`, `settings:manage_company`
- `client_hub:manage_contacts`

### supervisor
- `work_orders:*` (all)
- `technicians:read`, `technicians:update`
- `equipment:read`
- `vehicles:read`
- `clients:read`
- `dashboard:read`

### technician
- `work_orders:read`
- `dashboard:read`
- (Limited - field work only)

### project_coordinator
- `work_orders:*` (all)
- `technicians:read`
- `equipment:read`
- `vehicles:read`
- `clients:read`, `clients:create`, `clients:update`
- `dashboard:read`

### client
- Limited external access via Client Portal
- No internal permissions
- Access controlled by `can_access_client_hub()` function

---

*Last Updated: December 29, 2025*
*Version: 1.1*
