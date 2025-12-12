# 🏗️ Signage App - Modular Architecture Implementation Plan

> **Goal**: Transform the current codebase into a modular, scalable, and production-ready architecture.
> 
> **Estimated Time**: 2-3 days of focused work
> 
> **Created**: December 11, 2024

---

## 📊 Current State Summary

| Component | Files | Issue |
|-----------|-------|-------|
| `work-orders/page.tsx` | 743 lines | Monolithic - UI, logic, modals all mixed |
| `onboarding/page.tsx` | 575 lines | Large but acceptable for single-use page |
| `technicians/page.tsx` | 272 lines | Duplicated patterns with other CRUD pages |
| `dashboard/layout.tsx` | 159 lines | Could extract Sidebar/Header |
| `components/` | **EMPTY** | No reusable components |
| `lib/supabase.ts` | Legacy | Duplicate of `lib/supabase/client.ts` |

---

## 🎯 Target Architecture

```
signage-app/
├── app/                          # Routes only - minimal logic
├── components/                   # Reusable UI components
│   ├── ui/                      # Primitives (Button, Input, Modal, etc.)
│   ├── forms/                   # Form components
│   ├── tables/                  # Table components
│   ├── layout/                  # Layout components
│   └── [feature]/               # Feature-specific components
├── hooks/                        # Custom React hooks
├── services/                     # Business logic & API calls
├── lib/                          # Utilities & configurations
│   ├── supabase/                # Supabase clients
│   └── utils/                   # Helper functions
├── types/                        # TypeScript definitions
└── constants/                    # App-wide constants
```

---

## 📋 Implementation Phases

### Phase 1: Foundation Setup (Day 1 - Morning)
Set up the folder structure and create base utilities.

### Phase 2: UI Components (Day 1 - Afternoon)
Extract and create reusable UI primitives.

### Phase 3: Hooks & Services (Day 2 - Morning)
Create data fetching hooks and service layer.

### Phase 4: Page Refactoring (Day 2 - Afternoon)
Refactor existing pages to use new architecture.

### Phase 5: Polish & Documentation (Day 3)
Add error handling, cleanup, and update documentation.

---

## ✅ Phase 1: Foundation Setup

### Task 1.1: Create Folder Structure
**Time**: 15 minutes

```bash
# Create all required directories
mkdir -p components/ui
mkdir -p components/forms
mkdir -p components/tables
mkdir -p components/layout
mkdir -p components/work-orders
mkdir -p hooks
mkdir -p services
mkdir -p lib/utils
mkdir -p constants
```

**Files to create**:
- [ ] `components/ui/index.ts` - Export barrel file
- [ ] `components/forms/index.ts`
- [ ] `components/tables/index.ts`
- [ ] `components/layout/index.ts`
- [ ] `hooks/index.ts`
- [ ] `services/index.ts`
- [ ] `lib/utils/index.ts`
- [ ] `constants/index.ts`

### Task 1.2: Create Utility Functions
**Time**: 30 minutes

**File**: `lib/utils/formatters.ts`
```typescript
// Date formatting
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export function formatRelativeTime(dateString: string): string {
  // Returns "2 hours ago", "3 days ago", etc.
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// String helpers
export function truncateString(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}
```

**File**: `lib/utils/validators.ts`
```typescript
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPhone(phone: string): boolean {
  return /^[\d\s\-\+\(\)]{10,}$/.test(phone.trim());
}

export function isRequired(value: string): boolean {
  return value.trim().length > 0;
}
```

### Task 1.3: Create Constants File
**Time**: 15 minutes

**File**: `constants/config.ts`
```typescript
export const APP_CONFIG = {
  APP_NAME: 'Tops Lighting',
  MAX_ASSOCIATED_FILES: 9,
  SUPPORTED_FILE_TYPES: '.pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp',
  SUPPORTED_IMAGE_TYPES: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
} as const;

export const STATUS_OPTIONS = {
  EQUIPMENT: ['available', 'in-use', 'maintenance'] as const,
  VEHICLE: ['available', 'in-use', 'maintenance'] as const,
} as const;

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  ONBOARDING: '/onboarding',
  DASHBOARD: '/dashboard',
  TECHNICIANS: '/dashboard/technicians',
  EQUIPMENT: '/dashboard/equipment',
  VEHICLES: '/dashboard/vehicles',
  WORK_ORDERS: '/dashboard/work-orders',
} as const;
```

### Task 1.4: Remove Legacy Supabase Client
**Time**: 10 minutes

- [ ] Delete `lib/supabase.ts`
- [ ] Update all imports from `@/lib/supabase` to `@/lib/supabase/client`

**Files to update**:
- `app/dashboard/work-orders/page.tsx`
- `app/dashboard/technicians/page.tsx`
- `app/dashboard/equipment/page.tsx`
- `app/dashboard/vehicles/page.tsx`

---

## ✅ Phase 2: UI Components

### Task 2.1: Create Button Component
**Time**: 20 minutes

**File**: `components/ui/Button.tsx`
```typescript
'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, fullWidth, children, disabled, className = '', ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400',
      secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      ghost: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4\" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### Task 2.2: Create Input Component
**Time**: 15 minutes

**File**: `components/ui/Input.tsx`
```typescript
'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
```

### Task 2.3: Create Modal Component
**Time**: 25 minutes

**File**: `components/ui/Modal.tsx`
```typescript
'use client';

import { ReactNode, useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function Modal({ isOpen, onClose, title, children, size = 'md', showCloseButton = true }: ModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        {/* Body */}
        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {children}
        </div>
        
        {/* Footer (optional close button) */}
        {showCloseButton && (
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
            <Button onClick={onClose} fullWidth>
              Close
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 2.4: Create Loading & Empty State Components
**Time**: 15 minutes

**File**: `components/ui/LoadingSpinner.tsx`
```typescript
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`} />
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
}
```

**File**: `components/ui/EmptyState.tsx`
```typescript
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon = '📭', title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <span className="text-4xl">{icon}</span>
      <h3 className="mt-4 text-lg font-medium text-gray-900">{title}</h3>
      {description && <p className="mt-2 text-gray-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

### Task 2.5: Create Badge Component
**Time**: 10 minutes

**File**: `components/ui/Badge.tsx`
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}
```

### Task 2.6: Create Card Component
**Time**: 10 minutes

**File**: `components/ui/Card.tsx`
```typescript
interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
```

### Task 2.7: Create UI Index Export
**Time**: 5 minutes

**File**: `components/ui/index.ts`
```typescript
export { Button } from './Button';
export { Input } from './Input';
export { Modal } from './Modal';
export { LoadingSpinner } from './LoadingSpinner';
export { EmptyState } from './EmptyState';
export { Badge } from './Badge';
export { Card } from './Card';
```

---

## ✅ Phase 3: Hooks & Services

### Task 3.1: Create useAsync Hook
**Time**: 20 minutes

**File**: `hooks/useAsync.ts`
```typescript
import { useState, useCallback } from 'react';

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>() {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    setState({ data: null, loading: true, error: null });
    try {
      const result = await asyncFunction();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      setState({ data: null, loading: false, error: error as Error });
      throw error;
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}
```

### Task 3.2: Create useModal Hook
**Time**: 10 minutes

**File**: `hooks/useModal.ts`
```typescript
import { useState, useCallback } from 'react';

export function useModal<T = undefined>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(undefined);

  const open = useCallback((modalData?: T) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(undefined);
  }, []);

  return { isOpen, data, open, close };
}
```

### Task 3.3: Create Technicians Service
**Time**: 25 minutes

**File**: `services/technicians.service.ts`
```typescript
import { createClient } from '@/lib/supabase/client';
import { Technician } from '@/types/database';

const TABLE_NAME = 'technicians';

export const techniciansService = {
  async getAll(): Promise<Technician[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Technician | null> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(technician: Omit<Technician, 'id' | 'created_at'>): Promise<Technician> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([technician])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Technician>): Promise<Technician> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
```

### Task 3.4: Create Generic CRUD Service Factory
**Time**: 30 minutes

**File**: `services/crud.service.ts`
```typescript
import { createClient } from '@/lib/supabase/client';

export function createCrudService<T extends { id: string; created_at: string }>(tableName: string) {
  return {
    async getAll(): Promise<T[]> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as T[];
    },

    async getById(id: string): Promise<T | null> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as T;
    },

    async create(item: Omit<T, 'id' | 'created_at'>): Promise<T> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .insert([item])
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },

    async update(id: string, updates: Partial<T>): Promise<T> {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as T;
    },

    async delete(id: string): Promise<void> {
      const supabase = createClient();
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
  };
}
```

### Task 3.5: Create Equipment & Vehicle Services
**Time**: 10 minutes

**File**: `services/equipment.service.ts`
```typescript
import { createCrudService } from './crud.service';
import { Equipment } from '@/types/database';

export const equipmentService = createCrudService<Equipment>('equipment');
```

**File**: `services/vehicles.service.ts`
```typescript
import { createCrudService } from './crud.service';
import { Vehicle } from '@/types/database';

export const vehiclesService = createCrudService<Vehicle>('vehicles');
```

### Task 3.6: Create useCrud Hook
**Time**: 25 minutes

**File**: `hooks/useCrud.ts`
```typescript
import { useState, useEffect, useCallback } from 'react';

interface CrudService<T> {
  getAll: () => Promise<T[]>;
  create: (item: Omit<T, 'id' | 'created_at'>) => Promise<T>;
  update: (id: string, updates: Partial<T>) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

export function useCrud<T extends { id: string }>(service: CrudService<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await service.getAll();
      setItems(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [service]);

  const create = useCallback(async (item: Omit<T, 'id' | 'created_at'>) => {
    const newItem = await service.create(item);
    setItems(prev => [newItem, ...prev]);
    return newItem;
  }, [service]);

  const update = useCallback(async (id: string, updates: Partial<T>) => {
    const updatedItem = await service.update(id, updates);
    setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
    return updatedItem;
  }, [service]);

  const remove = useCallback(async (id: string) => {
    await service.delete(id);
    setItems(prev => prev.filter(item => item.id !== id));
  }, [service]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
}
```

### Task 3.7: Create Services Index Export
**Time**: 5 minutes

**File**: `services/index.ts`
```typescript
export { techniciansService } from './technicians.service';
export { equipmentService } from './equipment.service';
export { vehiclesService } from './vehicles.service';
export { createCrudService } from './crud.service';
```

### Task 3.8: Create Hooks Index Export
**Time**: 5 minutes

**File**: `hooks/index.ts`
```typescript
export { useAsync } from './useAsync';
export { useModal } from './useModal';
export { useCrud } from './useCrud';
```

---

## ✅ Phase 4: Page Refactoring

### Task 4.1: Create DataTable Component
**Time**: 30 minutes

**File**: `components/tables/DataTable.tsx`
```typescript
'use client';

import { LoadingSpinner, EmptyState } from '@/components/ui';

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string;
}

export function DataTable<T>({
  data,
  columns,
  loading,
  emptyMessage = 'No data found',
  onRowClick,
  keyExtractor,
}: DataTableProps<T>) {
  if (loading) {
    return <LoadingSpinner text="Loading..." />;
  }

  if (data.length === 0) {
    return <EmptyState title={emptyMessage} icon="📭" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td
                  key={`${keyExtractor(item)}-${String(col.key)}`}
                  className={`px-6 py-4 whitespace-nowrap text-sm ${col.className || ''}`}
                >
                  {col.render
                    ? col.render(item)
                    : String((item as any)[col.key] ?? '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Task 4.2: Create TechnicianForm Component
**Time**: 20 minutes

**File**: `components/forms/TechnicianForm.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Button, Input, Card } from '@/components/ui';
import { Technician } from '@/types/database';

interface TechnicianFormProps {
  onSubmit: (data: Omit<Technician, 'id' | 'created_at'>) => Promise<void>;
  initialData?: Partial<Technician>;
  loading?: boolean;
}

export function TechnicianForm({ onSubmit, initialData, loading }: TechnicianFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    skills: initialData?.skills?.join(', ') || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const skillsArray = formData.skills
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    await onSubmit({
      name: formData.name,
      email: formData.email || null,
      phone: formData.phone || null,
      skills: skillsArray.length > 0 ? skillsArray : null,
    });

    // Reset form
    setFormData({ name: '', email: '', phone: '', skills: '' });
  };

  return (
    <Card title="Add New Technician">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Skills (comma-separated)"
            placeholder="e.g. electrical, signage installation"
            value={formData.skills}
            onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
          />
        </div>
        <Button type="submit" loading={loading}>
          {loading ? 'Adding...' : 'Add Technician'}
        </Button>
      </form>
    </Card>
  );
}
```

### Task 4.3: Refactor Technicians Page
**Time**: 30 minutes

**File**: `app/dashboard/technicians/page.tsx` (refactored)
```typescript
'use client';

import { TechnicianForm } from '@/components/forms/TechnicianForm';
import { DataTable } from '@/components/tables/DataTable';
import { Button, Badge, Card } from '@/components/ui';
import { useCrud } from '@/hooks';
import { techniciansService } from '@/services';
import { Technician } from '@/types/database';
import { useState } from 'react';

export default function TechniciansPage() {
  const { items: technicians, loading, create, remove } = useCrud(techniciansService);
  const [submitting, setSubmitting] = useState(false);

  const handleCreate = async (data: Omit<Technician, 'id' | 'created_at'>) => {
    setSubmitting(true);
    try {
      await create(data);
      // TODO: Show success toast
    } catch (error) {
      // TODO: Show error toast
      console.error('Failed to add technician:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this technician?')) return;
    try {
      await remove(id);
      // TODO: Show success toast
    } catch (error) {
      // TODO: Show error toast
      console.error('Failed to delete technician:', error);
    }
  };

  const columns = [
    { key: 'name', header: 'Name', className: 'font-medium text-gray-900' },
    { key: 'email', header: 'Email', className: 'text-gray-500' },
    { key: 'phone', header: 'Phone', className: 'text-gray-500' },
    {
      key: 'skills',
      header: 'Skills',
      render: (tech: Technician) => (
        <div className="flex flex-wrap gap-1">
          {tech.skills?.map((skill, idx) => (
            <Badge key={idx} variant="info">{skill}</Badge>
          )) || '-'}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (tech: Technician) => (
        <Button variant="danger" size="sm" onClick={() => handleDelete(tech.id)}>
          Delete
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Technicians</h1>
      
      <TechnicianForm onSubmit={handleCreate} loading={submitting} />
      
      <Card title={`All Technicians (${technicians.length})`}>
        <DataTable
          data={technicians}
          columns={columns}
          loading={loading}
          keyExtractor={(tech) => tech.id}
          emptyMessage="No technicians found. Add your first technician above."
        />
      </Card>
    </div>
  );
}
```

### Task 4.4: Extract Layout Components
**Time**: 25 minutes

**File**: `components/layout/Sidebar.tsx`
```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  name: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Technicians', href: '/dashboard/technicians', icon: '👷' },
  { name: 'Equipment', href: '/dashboard/equipment', icon: '🔧' },
  { name: 'Vehicles', href: '/dashboard/vehicles', icon: '🚗' },
  { name: 'Work Orders', href: '/dashboard/work-orders', icon: '📋' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <aside
        className={`${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          fixed lg:static lg:translate-x-0 left-0 top-16 bottom-0 w-64 
          bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-20`}
      >
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-10"
          onClick={onClose}
        />
      )}
    </>
  );
}
```

**File**: `components/layout/Header.tsx`
```typescript
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui';

interface HeaderProps {
  userEmail?: string;
  onMenuToggle: () => void;
  onSignOut: () => void;
}

export function Header({ userEmail, onMenuToggle, onSignOut }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              TL
            </div>
            <span className="text-xl font-semibold text-gray-900">
              Tops Lighting
            </span>
          </Link>
        </div>

        {/* User Info & Logout */}
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-gray-600">
            {userEmail || 'User'}
          </span>
          <Button variant="danger" onClick={onSignOut}>
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
```

### Task 4.5: Extract Work Order Components
**Time**: 45 minutes

**File**: `components/work-orders/AnalysisModal.tsx`
- Extract the analysis modal (~200 lines) from work-orders/page.tsx

**File**: `components/work-orders/FilesModal.tsx`
- Extract the files modal (~80 lines) from work-orders/page.tsx

**File**: `components/work-orders/WorkOrderUpload.tsx`
- Extract the upload form (~100 lines) from work-orders/page.tsx

**File**: `components/work-orders/WorkOrderList.tsx`
- Extract the list/table (~120 lines) from work-orders/page.tsx

---

## ✅ Phase 5: Polish & Documentation

### Task 5.1: Add Toast Notifications
**Time**: 30 minutes

Install a toast library:
```bash
npm install react-hot-toast
# or
npm install sonner
```

**File**: `components/providers/ToastProvider.tsx`
```typescript
'use client';

import { Toaster } from 'react-hot-toast';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            style: { background: '#22c55e' },
          },
          error: {
            style: { background: '#ef4444' },
          },
        }}
      />
    </>
  );
}
```

Update `app/layout.tsx` to include the provider.

### Task 5.2: Add Error Boundary
**Time**: 20 minutes

**File**: `components/ErrorBoundary.tsx`
```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button, Card } from '@/components/ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return this.props.children;
  }
}
```

### Task 5.3: Update CONTEXT.md
**Time**: 15 minutes

Update the documentation to reflect the new folder structure and patterns.

### Task 5.4: Replace All Alert Calls
**Time**: 30 minutes

Search for all `alert(` calls and replace with toast notifications:
```typescript
// Before
alert('Technician added successfully!');

// After
import toast from 'react-hot-toast';
toast.success('Technician added successfully!');
```

### Task 5.5: Final Code Cleanup
**Time**: 20 minutes

- [ ] Remove unused imports
- [ ] Delete `lib/supabase.ts` (legacy file)
- [ ] Run `npm run build` to ensure no errors
- [ ] Run ESLint to fix any issues

---

## 📊 Progress Tracker

### Phase 1: Foundation Setup
- [x] 1.1 Create folder structure
- [x] 1.2 Create utility functions
- [x] 1.3 Create constants file
- [x] 1.4 Remove legacy Supabase client

### Phase 2: UI Components
- [x] 2.1 Create Button component
- [x] 2.2 Create Input component
- [x] 2.3 Create Modal component
- [x] 2.4 Create Loading & Empty State components
- [x] 2.5 Create Badge component
- [x] 2.6 Create Card component
- [x] 2.7 Create UI index export
- [x] 2.8 Create Select component (bonus)
- [x] 2.9 Create Textarea component (bonus)
- [x] 2.10 Create ConfirmDialog component (bonus)
- [x] 2.11 Create Alert component (bonus)
- [x] 2.12 Create Avatar component (bonus)
- [x] 2.13 Create DataTable component

### Phase 3: Hooks & Services
- [x] 3.1 Create useAsync hook
- [x] 3.2 Create useModal hook
- [x] 3.3 Create Technicians service
- [x] 3.4 Create generic CRUD service factory
- [x] 3.5 Create Equipment & Vehicle services
- [x] 3.6 Create useCrud hook
- [x] 3.7 Create services index export
- [x] 3.8 Create hooks index export
- [x] 3.9 Create useConfirmDialog hook (bonus)
- [x] 3.10 Create Work Orders service (bonus)

### Phase 4: Page Refactoring
- [x] 4.1 Create DataTable component
- [x] 4.2 Create TechnicianForm component
- [x] 4.3 Refactor Technicians page
- [x] 4.4 Extract Layout components
- [x] 4.5 Extract Work Order components
- [x] 4.6 Refactor Equipment page
- [x] 4.7 Refactor Vehicles page
- [x] 4.8 Refactor Work Orders page
- [x] 4.9 Refactor Dashboard layout

### Phase 5: Polish & Documentation
- [x] 5.1 Add toast notifications
- [x] 5.2 Add error boundary
- [x] 5.3 Update CONTEXT.md
- [x] 5.4 Replace all alert calls
- [x] 5.5 Final code cleanup

---

## 🎯 Success Criteria

When complete, your codebase should have:

1. **No page file > 200 lines** (excluding imports)
2. **All reusable UI in `components/`**
3. **All business logic in `services/`**
4. **All reusable state logic in `hooks/`**
5. **Consistent Supabase client usage**
6. **Toast notifications instead of alerts**
7. **Error boundaries for crash recovery**
8. **Updated documentation**

---

## 💡 Tips for Implementation

1. **Work incrementally** - Don't try to refactor everything at once
2. **Test after each task** - Run `npm run dev` and verify nothing broke
3. **Commit frequently** - Small commits make it easy to revert if needed
4. **Start with simple components** - Build confidence before tackling work-orders
5. **Use TypeScript strictly** - Don't use `any` types

---

**Last Updated**: December 11, 2024
