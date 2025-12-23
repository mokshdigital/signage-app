# Cursor AI Prompts - Successful Patterns

This document contains all the successful prompts used during development. Use these as templates for future features.

---

## Project Setup

### Initial Setup Prompt
```
Create a Next.js 15 dashboard app for a signage business with:
- TypeScript
- Tailwind CSS
- Supabase integration
- Dashboard layout with sidebar navigation
```

**Result**: Complete Next.js project with proper configuration

---

## Database & Schema

### Database Schema Creation
```
Create a Supabase database schema with these tables:
1. technicians (id, name, email, phone, skills array)
2. equipment (id, name, type, status enum)
3. vehicles (id, name, license_plate, type, status)
4. work_orders (id, uploaded_by, file_url, file_name, processed, analysis jsonb)

Include:
- UUID primary keys
- Timestamps
- Indexes for performance
- Row Level Security policies
```

**Result**: Complete SQL schema with RLS policies

### Storage Bucket Setup
```
Create setup instructions for a Supabase Storage bucket named 'work-orders' with:
- Public read access
- Anonymous upload capability
- RLS policies for insert/select/delete
- Support for PDF and image files
```

**Result**: SQL and manual setup guide for storage

---

## UI Components

### Dashboard Layout
```
Create a responsive dashboard layout with:
- Top navigation bar with logo and logout button
- Sidebar with links to: Dashboard, Technicians, Equipment, Vehicles, Work Orders
- Mobile hamburger menu
- Tailwind CSS styling
```

**Result**: Fully responsive layout component

### CRUD Page Template
```
Create a [Entity] management page with:
- Form to add new [entity] with fields: [field1, field2, field3]
- Table displaying all [entities]
- Delete button with confirmation
- Color-coded status badges (if applicable)
- Supabase integration for CRUD operations
```

**Result**: Complete CRUD page with form, table, and actions

**Example for Technicians**:
```
Create a Technicians management page with:
- Form to add new technician (name, email, phone, comma-separated skills)
- Table displaying all technicians with skill badges
- Delete button with confirmation
- Supabase integration for CRUD operations
```

---

## File Upload & Storage

### Work Orders Upload Page
```
Create a work orders page with:
- File upload form (accept PDF, images, Word docs)
- Upload to Supabase Storage 'work-orders' bucket
- Create database record with file URL
- Display list of all uploaded work orders
- Show file name, upload date, and processing status
- Process and Delete buttons
```

**Result**: Complete file upload with storage integration

---

## AI Integration

### API Route for AI Processing
```
Create an API route at /app/api/process-work-order/route.ts that:
1. Accepts a work order ID
2. Fetches the file from Supabase Storage
3. If PDF, extract text; if image, use Gemini Vision
4. Send to Gemini API with this prompt:
   "You are analyzing a work order for a signage installation company. 
   Extract and return JSON with: jobType, location, orderedBy, contactInfo,
   resourceRequirements {techSkills, equipment, vehicles}, permitsRequired,
   numberOfTechs, estimatedHours, estimatedDays, clientQuestions,
   technicianQuestions, technicalRequirements, accessRequirements,
   riskFactors, additionalDetails"
5. Save JSON to work_orders.analysis field
6. Set processed = true
7. Return the analysis

Use @google/generative-ai package. Handle errors gracefully.
```

**Result**: Complete AI processing endpoint

### Model Update
```
Change the Gemini model to gemini-2.5-pro in both PDF and image analysis functions
```

**Result**: Updated model references

---

## Data Display

### Analysis View Modal
```
Create a modal to display work order analysis with sections for:
- Job Type & Location (grid layout)
- Client Information (ordered by, contact info)
- Resource Requirements (tech skills, equipment, vehicles as colored badges)
- Staffing & Timeline (number of techs, hours, days)
- Permits Required (list)
- Technical & Access Requirements (side by side)
- Risk Factors (red text)
- Client & Technician Questions (two columns)
- Additional Details (formatted)

Add a "View Analysis" button that appears for processed work orders.
```

**Result**: Comprehensive analysis display modal

---

## Bug Fixes

### RLS Policy Fix
```
Fix the "new row violates row-level security policy" error by:
1. Disabling RLS on work_orders table temporarily
2. Creating permissive policies for development
3. Allowing anonymous inserts/reads/deletes
```

**Result**: Working database inserts

### Storage Policy Fix
```
Fix Storage bucket RLS policies for 'work-orders' bucket:
- Allow anonymous uploads (INSERT)
- Allow public reads (SELECT)
- Allow authenticated deletes (DELETE)
- Set bucket to public
```

**Result**: Working file uploads

### PDF Parsing Fix
```
The pdf-parse library has compatibility issues with Next.js. 
Replace it with Gemini's native PDF support:
1. Remove pdf-parse import
2. Use Gemini 2.5 Pro to directly analyze PDFs
3. Send PDF as base64 with mimeType 'application/pdf'
```

**Result**: Working PDF processing

### React Rendering Error Fix
```
Fix "Objects are not valid as React child" error by:
1. Creating a safeRender() helper function
2. Check if value is string, number, or object
3. Convert objects to JSON.stringify()
4. Apply to all analysis fields that might be objects
```

**Result**: No more React rendering errors

---

## TypeScript Patterns

### Safe Type Handling
```typescript
// Helper to safely render any value
const safeRender = (value: any): string => {
  if (!value) return 'N/A';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return JSON.stringify(value, null, 2);
};
```

### Supabase Client Setup
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Database Type Interfaces
```typescript
export interface Technician {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  skills: string[] | null;
  created_at: string;
}
```

---

## Styling Patterns

### Status Badge Component
```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${
  status === 'available' 
    ? 'bg-green-100 text-green-700'
    : status === 'in-use'
    ? 'bg-yellow-100 text-yellow-700'
    : 'bg-red-100 text-red-700'
}`}>
  {status}
</span>
```

### Modal Overlay
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
    {/* Modal content */}
  </div>
</div>
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

### Tabbed Settings Layout
```tsx
// Create a layout with tabs for navigation
// app/dashboard/settings/layout.tsx
const tabs = [
    { name: 'Roles', href: '/dashboard/settings/roles', permission: 'roles:manage' },
    { name: 'Users', href: '/dashboard/settings/users', permission: 'users:manage' },
];

return (
    <div>
        <h1>Settings</h1>
        <nav className="flex space-x-4 border-b">
            {tabs.map(tab => (
                 <Link 
                    key={tab.name} 
                    href={tab.href}
                    className={pathname === tab.href ? 'border-blue-500' : 'border-transparent'}
                 >
                    {tab.name}
                 </Link>
            ))}
        </nav>
        {children}
    </div>
);
```

---

## API Patterns

### Fetch with Error Handling
```typescript
const response = await fetch('/api/process-work-order', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ workOrderId: id }),
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data.error || 'Failed to process');
}
```

### Supabase CRUD Operations
```typescript
// Create
const { data, error } = await supabase
  .from('technicians')
  .insert([{ name, email, phone, skills }]);

// Read
const { data, error } = await supabase
  .from('technicians')
  .select('*')
  .order('created_at', { ascending: false });

// Delete
const { error } = await supabase
  .from('technicians')
  .delete()
  .eq('id', id);
```

### File Upload to Storage
```typescript
const fileExt = file.name.split('.').pop();
const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

const { data, error } = await supabase.storage
  .from('work-orders')
  .upload(fileName, file);

const { data: urlData } = supabase.storage
  .from('work-orders')
  .getPublicUrl(fileName);
```

---

## Gemini AI Patterns

### PDF Analysis
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const pdfPart = {
  inlineData: {
    data: pdfBuffer.toString('base64'),
    mimeType: 'application/pdf',
  },
};

const result = await model.generateContent([PROMPT, pdfPart]);
const response = await result.response;
return response.text();
```

### Image Analysis
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

const imagePart = {
  inlineData: {
    data: imageBuffer.toString('base64'),
    mimeType: `image/${fileExtension}`,
  },
};

const result = await model.generateContent([PROMPT, imagePart]);
```

### Structured Output Prompt
```
You are analyzing a work order. Extract and return ONLY valid JSON with these fields:
{
  "field1": "value",
  "field2": ["array", "values"],
  "field3": { "nested": "object" }
}

Return ONLY valid JSON, no markdown formatting or code blocks.
```

---

## Documentation Prompts

### Create Documentation
```
Create these documentation files in the project root:
- CONTEXT.md - Overview, tech stack, folder structure
- PHASE_LOG.md - Development phases and completed tasks
- DATABASE_SCHEMA.md - All table structures and relationships
- API_ENDPOINTS.md - List all API routes and what they do
- CURSOR_PROMPTS.md - Successful prompts used
```

**Result**: Complete documentation suite

---

## Best Practices Learned

### 1. Always Specify Types
```
✅ "Create a form with fields: name (text), email (text), skills (text array)"
❌ "Create a form with some fields"
```

### 2. Include Error Handling
```
✅ "Add try-catch blocks and display error messages to the user"
❌ "Just make it work"
```

### 3. Be Specific About Styling
```
✅ "Use Tailwind CSS with blue-600 buttons, gray-100 backgrounds, rounded-lg borders"
❌ "Make it look nice"
```

### 4. Request Complete Solutions
```
✅ "Create the component with state management, API calls, and error handling"
❌ "Create a component" (then ask for state, then API, then errors separately)
```

### 5. Provide Context
```
✅ "In the work orders page, add a View Analysis button next to processed orders"
❌ "Add a button" (where? what does it do?)
```

---

## Template Prompts for Future Features

### Add New Entity
```
Create a [EntityName] management page with:
- Form to add new [entity] with fields: [field1, field2, field3]
- Table displaying all [entities] with [specific columns]
- Edit and Delete buttons with confirmation
- [Any special features like status badges, filters, etc.]
- Supabase integration for full CRUD operations
- TypeScript interface in types/database.ts
```

### Add New API Endpoint
```
Create an API route at /app/api/[route-name]/route.ts that:
1. [What it receives]
2. [What it does]
3. [What it returns]
4. Handle errors: [specific error cases]
5. Use [specific libraries/services]
```

### Add Authentication
```
Implement Supabase authentication with:
- Login page with email/password
- Registration page
- Protected routes (redirect to login if not authenticated)
- User context provider
- Logout functionality
- Update RLS policies to use auth.uid()
```

### Add Real-time Features
```
Add real-time updates using Supabase subscriptions for:
- [Entity] changes (insert, update, delete)
- Update the UI automatically when data changes
- Show notification when new [entity] is added
```

---

## Team Tab & Chat Patterns

### Real-time Chat with Supabase Realtime
```tsx
// Subscribe to chat messages for a work order
useEffect(() => {
    const supabase = createClient();
    const channel = supabase
        .channel(`chat:${workOrderId}`)
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'work_order_chat_messages',
            filter: `work_order_id=eq.${workOrderId}`
        }, (payload) => {
            if (payload.eventType === 'INSERT') {
                setMessages(prev => [...prev, payload.new as ChatMessage]);
            } else if (payload.eventType === 'UPDATE') {
                setMessages(prev => prev.map(m => 
                    m.id === payload.new.id ? payload.new as ChatMessage : m
                ));
            }
        })
        .subscribe();
    
    return () => {
        supabase.removeChannel(channel);
    };
}, [workOrderId]);
```

### Team Roster Component Pattern
```
Create a TeamRoster component that:
- Displays WO Owner (read-only, avatar + name)
- Office Staff section with add/remove capability
- Technicians section with link to Technicians tab
- Uses chip selector for adding office staff
- Confirmation prompt before removing team members
```

### Chat Message with Hover Actions
```tsx
// Message with hover-revealed action menu
<div className="group relative">
    <div className="message-content">...</div>
    {isOwnMessage && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)}>...</button>
            {isMenuOpen && (
                <div className="dropdown-menu">
                    <button onClick={handleEdit}>Edit</button>
                    <button onClick={handleDelete}>Delete</button>
                </div>
            )}
        </div>
    )}
</div>
```

### File Picker Modal (Grouped by Category)
```
Create a file picker modal that:
- Groups WO files by category
- Shows expandable category sections
- Displays thumbnails for images/PDFs
- Shows chip-style items for other files
- Allows multi-select
- Returns array of selected file IDs
```

---

## Troubleshooting Prompts

### When Something Doesn't Work
```
I'm getting this error: [paste error message]
In file: [file path]
When doing: [what you were trying to do]

Please help me fix it.
```

### When You Need to Refactor
```
The current [component/function] at [file path] is [problem].
Please refactor it to [desired outcome] while maintaining [what should stay the same].
```

### When You Need to Debug
```
Add console.log statements to debug:
- [What data to log]
- [At which points in the code]
- Format the output to be readable
```
