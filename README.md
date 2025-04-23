# Event Dashboard Management by hexaTech

A Next.js full-stack application for managing events with role-based access control.

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Next.js API Routes, Supabase
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI, PrimeReact


## Authentication Flow

1. **Login**
   - Users access `/login` page
   - Submit credentials (email/password)
   - Server validates and creates session
   - Redirects to appropriate dashboard based on role

2. **Session Management**
   - Session stored in Supabase
   - Protected routes check for valid session
   - Role-based access control for dashboards
   - Automatic session refresh and persistence

3. **Role-Based Access**
   - Admin Dashboard (`/dashboard/admin`)
   - Collaborator Dashboard (`/dashboard`)
   - Middleware enforces role-based routing

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
