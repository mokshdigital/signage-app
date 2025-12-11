# Tops Lighting Signage Dashboard - Context

## Overview
A comprehensive dashboard application for managing a signage installation business. The app handles technician management, equipment tracking, vehicle fleet management, and AI-powered work order processing.

## What This App Does
- **Technician Management**: Track technicians, their skills, contact information, and availability
- **Equipment Management**: Monitor equipment inventory, status (available/in-use/maintenance), and types
- **Vehicle Fleet Management**: Track company vehicles, license plates, and maintenance status
- **AI-Powered Work Order Processing**: Upload work orders (PDF/images), automatically extract job details using Google's Gemini AI, and view structured analysis
- **Resource Planning**: Match work orders with required technicians, equipment, and vehicles

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (planned)
  - Storage for work order files
  - Row Level Security (RLS)

### AI/ML
- **Google Gemini 2.5 Pro** - AI model for work order analysis
  - PDF text extraction and analysis
  - Image analysis (OCR and understanding)
  - Structured data extraction

### Key Dependencies
- `@supabase/supabase-js` - Supabase client
- `@google/generative-ai` - Gemini AI SDK
- `pdfjs-dist` - PDF processing utilities

## Folder Structure

```
signage-app/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   └── process-work-order/   # Work order AI processing endpoint
│   │       └── route.ts
│   ├── dashboard/                # Dashboard pages
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── technicians/          # Technician management
│   │   │   └── page.tsx
│   │   ├── equipment/            # Equipment management
│   │   │   └── page.tsx
│   │   ├── vehicles/             # Vehicle management
│   │   │   └── page.tsx
│   │   └── work-orders/          # Work order management
│   │       └── page.tsx
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # Reusable React components (future)
├── lib/                          # Utility libraries
│   └── supabase.ts               # Supabase client configuration
├── types/                        # TypeScript type definitions
│   └── database.ts               # Database table interfaces
├── public/                       # Static assets
├── .env.local                    # Environment variables (not in git)
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
└── tsconfig.json                 # TypeScript configuration
```

## Environment Variables

Required environment variables in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional)

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key (if needed client-side)

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Key Features

### 1. Dashboard Layout
- Responsive sidebar navigation
- Mobile-friendly hamburger menu
- Consistent header with branding
- Logout functionality (placeholder)

### 2. CRUD Operations
All entity pages support:
- **Create**: Add new records via forms
- **Read**: View all records in tables
- **Delete**: Remove records with confirmation

### 3. Work Order AI Processing
- Upload PDF or image work orders
- AI extracts structured information:
  - Job type and location
  - Client information
  - Resource requirements (skills, equipment, vehicles)
  - Staffing needs and timeline estimates
  - Permits, technical requirements, access needs
  - Risk factors and questions
- View analysis in formatted modal

### 4. Status Management
- Color-coded status badges
- Real-time status updates
- Visual indicators for availability

## Development Workflow

1. **Local Development**: `npm run dev` (runs on http://localhost:3000)
2. **Database Changes**: Update SQL in Supabase dashboard
3. **Type Updates**: Modify `types/database.ts` to match schema
4. **API Routes**: Add new routes in `app/api/`
5. **Pages**: Create new pages in `app/dashboard/`

## Future Enhancements
- User authentication with Supabase Auth
- Work order assignment to technicians
- Calendar/scheduling view
- Mobile app (React Native)
- Real-time notifications
- Analytics and reporting
- Equipment maintenance tracking
- Vehicle GPS tracking integration
