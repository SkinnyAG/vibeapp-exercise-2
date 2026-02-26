# AI Guidebook for Students

A Next.js application for students to log, manage, and reflect on their AI tool usage (e.g., ChatGPT, GitHub Copilot) in alignment with institutional academic integrity policies.

## Features Implemented

### Core Requirements

- **FR-01: Guideline Retrieval** - Students can view AI usage guidelines for their courses
- **FR-03: AI Usage Logging** - Students can log their AI tool usage for assignments (3-click process per NFR-02)
- **FR-11: Project-Based Dashboard** - Display assignments with AI usage statistics
- **FR-15: Guideline Feedback** - Students can provide anonymous or attributed feedback on course guidelines
- **FR-27: Role-Based Access Control** - System supports Student, Lecturer, System Admin, and Institutional Admin roles
- **FR-28: Authentication** - Email/password authentication with BetterAuth

### Non-Functional Requirements

- **NFR-02: Usability** - AI logging requires ≤3 interactions (fill tool name, fill purpose, submit)
- **NFR-04: Security** - Strict role-based permissions with row-level security checks

## Tech Stack

- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Drizzle ORM
- **Authentication**: BetterAuth (session-based)
- **Validation**: Zod
- **Forms**: React Hook Form
- **Markdown**: react-markdown with remark-gfm

## Project Structure

```
/Users/andgjers/Development/vibeapp/
├── app/
│   ├── (auth)/                      # Authentication routes
│   │   ├── login/page.tsx          # Login page (FR-28)
│   │   ├── signup/page.tsx         # Student registration
│   │   └── layout.tsx
│   ├── (student)/                   # Student-protected routes
│   │   ├── dashboard/page.tsx      # Assignment dashboard (FR-11)
│   │   ├── courses/
│   │   │   └── [courseId]/
│   │   │       ├── guidelines/page.tsx           # View guidelines (FR-01)
│   │   │       ├── feedback/page.tsx             # Submit feedback (FR-15)
│   │   │       └── assignments/[assignmentId]/
│   │   │           └── logs/new/page.tsx        # Log AI usage (FR-03)
│   │   └── layout.tsx
│   ├── api/auth/[...all]/route.ts  # BetterAuth API
│   ├── layout.tsx
│   └── page.tsx                     # Root redirect
├── lib/
│   ├── auth/
│   │   ├── config.ts               # BetterAuth configuration
│   │   ├── client.ts               # Auth client for React
│   │   ├── middleware.ts           # Route protection (preserved but unused)
│   │   └── permissions.ts          # RBAC utilities
│   ├── db/
│   │   ├── index.ts                # Drizzle client
│   │   └── schema.ts               # Drizzle schema
│   ├── actions/                    # Server Actions
│   │   ├── ai-logs.ts
│   │   ├── feedback.ts
│   │   ├── auth.ts
│   │   └── onboarding.ts          # New user setup
│   └── validations/                # Zod schemas
│       ├── ai-log.ts
│       └── feedback.ts
├── components/
│   └── forms/
│       ├── ai-log-form.tsx
│       └── feedback-form.tsx
├── db/
│   └── seed.ts                     # Mock data
├── drizzle.config.ts               # Drizzle Kit configuration
└── middleware.ts                   # Simplified (no auth checks)

```

## Database Schema

The application uses Drizzle ORM with SQLite. Schema is defined in `lib/db/schema.ts`.

### Tables

- **User**: Students, lecturers, and administrators with role-based access
- **Account**: BetterAuth account table for credentials
- **Session**: Authentication sessions
- **Verification**: Email verification tokens
- **Institution**: Multi-tenancy support for multiple universities
- **Course**: Courses with AI usage guidelines (stored as markdown)
- **CourseEnrollment**: Many-to-many relationship between users and courses
- **Assignment**: Course assignments
- **AIUsageLog**: Logs of AI tool usage (FR-03)
- **GuidelineFeedback**: Student feedback on guidelines (FR-15)

## Setup Instructions

### Prerequisites

- Node.js 18+ or Bun
- npm or pnpm

### Installation

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables** (create `.env.local`):

   ```bash
   BETTER_AUTH_SECRET="your-secret-key-change-this-in-production"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

3. **Initialize database**:

   ```bash
   npm run db:push
   ```

   This creates all tables in `dev.db` based on the Drizzle schema.

4. **Seed database with mock data**:

   ```bash
   npm run db:seed
   ```

   This creates:
   - University of Example institution
   - 1 lecturer account
   - 2 courses (CS101, CS201) with AI guidelines in markdown
   - 5 assignments

5. **Run development server**:

   ```bash
   npm run dev
   ```

6. **Open** [http://localhost:3000](http://localhost:3000)

### Test Credentials

**Lecturer**: `lecturer@university.edu` / `password123`

**Students**: Register your own account at [/signup](http://localhost:3000/signup)

- Students are automatically:
  - Assigned to the default institution
  - Enrolled in all available courses (CS101, CS201)
  - Email verified

## Usage Workflows

### Student: Log AI Usage (FR-03)

1. Sign in as a student
2. View dashboard with assignments
3. Click "Log AI Usage" on any assignment
4. **3 interactions total (NFR-02)**:
   - Enter AI tool name (e.g., "ChatGPT")
   - Enter purpose description
   - Click "Submit AI Usage Log"
5. Log is saved and dashboard is updated

### Student: View Guidelines (FR-01)

1. From dashboard, click "View Guidelines" on any assignment
2. See course-specific AI usage policies
3. Review permitted/restricted uses
4. Optionally provide feedback

### Student: Provide Feedback (FR-15)

1. Navigate to course guidelines
2. Click "Provide Feedback on Guidelines"
3. Write feedback text
4. Choose anonymous or attributed submission
5. Submit feedback

### Dashboard (FR-11)

- View all enrolled courses
- See all assignments sorted by due date
- Track how many AI logs submitted per assignment
- Quick access to log AI usage or view guidelines

## Security & Permissions (NFR-04, FR-27)

### Role Hierarchy

1. **Student**: View own data, log AI usage, view guidelines, submit feedback
2. **Lecturer**: All student permissions + manage courses they teach
3. **Institutional Admin**: Manage institution-wide policies
4. **System Admin**: Full system access

### Security Measures

- Session-based authentication with httpOnly cookies
- Server Actions validate user sessions and permissions
- Row-level security: users can only access data they're enrolled in
- Middleware blocks unauthenticated access to protected routes
- Input validation with Zod on client and server

## Architecture Decisions

### Why Server Components?

- Automatic caching and performance optimization
- No useState/useEffect for data fetching
- Reduced client bundle size
- Security: sensitive data never sent to client

### Why Session-Based Auth vs JWTs?

- Server-side revocation (instant logout)
- No token refresh complexity
- Better security (httpOnly cookies)
- Simpler implementation with BetterAuth

### Why Skip TanStack Query?

- Server Components handle caching natively
- Server Actions + `revalidatePath()` for cache invalidation
- Reduced complexity and bundle size
- Next.js patterns are sufficient for this use case

### Why Drizzle ORM instead of Prisma?

- Better compatibility with BetterAuth adapters
- Simpler SQLite integration with better-sqlite3
- Type-safe queries with full TypeScript inference
- More lightweight and faster builds
- No code generation step (except for migrations)

### Why Page-Level Authentication?

- Middleware session timing issues caused redirect loops
- Page-level `getSession()` checks are more reliable
- Simpler debugging and error handling
- Better separation of concerns

## Development Commands

```bash
# Development
npm run dev           # Start dev server

# Database
npm run db:push       # Push schema changes to database
npm run db:seed       # Seed database with mock data
npm run db:studio     # Open Drizzle Studio (database GUI)

# Build
npm run build         # Production build
npm start            # Run production server

# Linting
npm run lint         # Run ESLint
```

### Database Reset

If you need to completely reset the database:

```bash
rm -f dev.db          # Delete database file
npm run db:push       # Recreate tables
npm run db:seed       # Add mock data
```

## Troubleshooting

### "no such table" error when seeding

Run `npm run db:push` first to create the database tables before running `npm run db:seed`.

### Port 3000 already in use

Kill the existing process:

```bash
lsof -ti:3000 | xargs kill -9
```

### Authentication redirect loop

Clear your browser cookies for localhost:3000 and try again. The application uses page-level authentication which is more reliable than middleware-based auth.

### Guidelines not showing markdown formatting

Make sure `react-markdown` and `remark-gfm` are installed:

```bash
npm install react-markdown remark-gfm
```

## Recent Updates

- ✅ **Student Self-Registration**: Students can create their own accounts at `/signup`
- ✅ **Auto-Enrollment**: New students automatically enrolled in all institution courses
- ✅ **Markdown Guidelines**: Course AI guidelines rendered with proper formatting
- ✅ **Simplified Authentication**: Moved from middleware to page-level auth checks
- ✅ **Drizzle Migration**: Complete migration from Prisma to Drizzle ORM

## Future Enhancements

- **Lecturer Features**: View student logs, manage guidelines, respond to feedback
- **Admin Dashboard**: User management, institution settings
- **Selective Course Enrollment**: Allow students to choose courses instead of auto-enrollment
- **Notifications**: Email reminders for AI logging
- **Analytics**: AI usage patterns and statistics
- **Export**: Download AI usage reports
- **Versioned Guidelines**: Track guideline changes over time
- **Assignment Integration**: LMS integration (Canvas, Blackboard)
- **Rich Text Editor**: WYSIWYG editor for guidelines instead of markdown

## License

MIT
