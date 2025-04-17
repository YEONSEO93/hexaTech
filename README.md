# Event Dashboard Management

A Next.js application for managing events with role-based access control.

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS


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

3. **Admin Dashboard**
   - Accessible at `/dashboard/admin`
   - Displays user information
   - Role-specific features and controls

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
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```
