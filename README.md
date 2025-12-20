This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Key Features

- **Dashboard**: Centralized hub for managing signage operations.
- **Settings & RBAC**: Comprehensive Role-Based Access Control and System Settings.
  - Manage Roles and Permissions.
  - Manage Users and assignments.
  - **Job Types**: Customize available job categories.
- **User Profile**:
  - Rich profile dropdown with Avatar and Role display.
  - Profile Settings page.
- **Work Orders**:
  - AI-Powered Analysis (Gemini 3 Flash Preview).
  - **Two-Step Upload Flow**: Upload files → AI analyzes → Review & enrich data.
  - AI recommendations for Client and Job Type matching.
  - Native PDF and image processing.
  - In-app File Viewer (PDF/images).
  - Advanced Search and Filtering.
  - **Task Management**:
    - Checklists and templates.
    - Technician assignment with status indicators.
    - **Task Comments**: Threaded comments with @mentions and file attachments.
    - **Task Categories**: WO-scoped categories with colors.
    - **Task Tags**: Global tags with multi-select and colors.
  - **Shipping Comments**: Threaded conversation system for tracking shipments.
- **Client Management**:
  - Client directory with project manager contacts.
  - Link work orders to clients.
- **Resource Management**:
  - Technicians, Equipment, and Vehicle tracking.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Environment Variables Required

**IMPORTANT**: Before deploying to Vercel, you must set the following environment variables in your Vercel project settings:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

#### Required Variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `GEMINI_API_KEY` - Your Google Gemini API key

#### Optional Variables:
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
- `NEXT_PUBLIC_APP_URL` - Your app URL (defaults to Vercel deployment URL)

### How to Get Your Keys:

1. **Supabase Keys**: 
   - Go to your Supabase project dashboard
   - Navigate to **Settings** → **API**
   - Copy the `Project URL` (for `NEXT_PUBLIC_SUPABASE_URL`)
   - Copy the `anon public` key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

2. **Gemini API Key**:
   - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy it to `GEMINI_API_KEY`

### After Adding Environment Variables:
- Redeploy your application in Vercel
- The build should now succeed

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
