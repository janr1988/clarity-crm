# Clarity CRM

A clean, functional CRM MVP built with Next.js, TypeScript, Tailwind CSS, and Prisma.

## Features

### For Sales Leads
- **Team Overview Dashboard**: See what the team is working on
- **Capacity Monitoring**: Check who has free capacity
- **Performance KPIs**: Evaluate team performance
- **Agent Details**: Drill into individual sales agent details
- **Task Reassignment**: Reassign tasks during absences
- **AI Insights**: Get AI-powered team performance insights and recommendations

### For All Employees
- **Activity Logging**: Log calls, meetings, emails, and notes
- **Task Planning**: Plan and track daily tasks
- **Call Notes**: Take detailed call notes with AI summary generation
- **Performance Tracking**: View personal statistics and metrics

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with SQLite (local) / PostgreSQL (production)
- **Validation**: Zod
- **UI Design**: Clean, minimal design inspired by Linear, Notion, and Apple

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Clarity
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Initialize the database**
   ```bash
   pnpm db:push
   ```

5. **Seed the database with sample data**
   ```bash
   pnpm db:seed
   ```

6. **Run the development server**
   ```bash
   pnpm dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Commands

- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Prisma Studio (visual database editor)
- `pnpm db:seed` - Seed database with sample data

## Project Structure

```
Clarity/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── users/        # User endpoints
│   │   │   ├── tasks/        # Task endpoints
│   │   │   ├── activities/   # Activity endpoints
│   │   │   └── call-notes/   # Call note endpoints
│   │   ├── users/            # Team pages
│   │   ├── tasks/            # Task pages
│   │   ├── activities/       # Activity pages
│   │   ├── call-notes/       # Call note pages
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Dashboard
│   ├── components/            # React components
│   │   ├── Sidebar.tsx
│   │   ├── TaskCreateForm.tsx
│   │   ├── TaskEditForm.tsx
│   │   ├── ActivityCreateForm.tsx
│   │   ├── CallNoteCreateForm.tsx
│   │   └── CallNoteEditForm.tsx
│   └── lib/                   # Utilities
│       ├── prisma.ts         # Prisma client
│       ├── validation.ts     # Zod schemas
│       └── utils.ts          # Helper functions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Seed script
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

## Sample Data

The seed script creates:
- 1 Sales Lead (Sarah Thompson - lead@clarity.com)
- 3 Sales Agents (John, Emma, Mike)
- Sample tasks, activities, and call notes

## API Endpoints

### Users
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create new user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/:id` - Get task details
- `POST /api/tasks` - Create new task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Activities
- `GET /api/activities` - List all activities
- `GET /api/activities/:id` - Get activity details
- `POST /api/activities` - Create new activity
- `PATCH /api/activities/:id` - Update activity
- `DELETE /api/activities/:id` - Delete activity

### Call Notes
- `GET /api/call-notes` - List all call notes
- `GET /api/call-notes/:id` - Get call note details
- `POST /api/call-notes` - Create new call note
- `PATCH /api/call-notes/:id` - Update call note
- `DELETE /api/call-notes/:id` - Delete call note

### AI Features
- `GET /api/ai/insights` - Get AI-powered team insights (Bonus feature)

## Bonus AI Feature: Team Insights

The `/api/ai/insights` endpoint provides AI-powered insights for Sales Leads:

- **Team Performance Analysis**: Identify high performers and those needing support
- **Capacity Recommendations**: Suggest optimal task distribution
- **Trend Detection**: Spot patterns in activities and outcomes
- **Action Items**: Actionable recommendations for improving team performance

Access this feature from the Dashboard (Sales Lead view).

## Production Deployment

### Database Migration

For production with PostgreSQL/Neon:

1. Update `.env`:
   ```
   DATABASE_URL="postgresql://user:password@host:5432/clarity?schema=public"
   ```

2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

3. Run migrations:
   ```bash
   pnpm db:push
   ```

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

## Testing Checklist

- [ ] Dashboard loads and displays stats
- [ ] Team page shows all members
- [ ] User detail page shows tasks and activities
- [ ] Create new task form works
- [ ] Edit task and reassign works
- [ ] Activity logging works
- [ ] Call note creation works
- [ ] AI summary generation works (simulated)
- [ ] All navigation links work
- [ ] Responsive design on mobile
- [ ] No TypeScript errors
- [ ] No console errors

## Design System

- **Background**: `#f9fafb` (off-white)
- **Primary**: `#3B82F6` (blue)
- **Font**: Inter
- **Border Radius**: 12px
- **Shadow**: `0 2px 8px rgba(0,0,0,0.05)`
- **Spacing**: p-6, gap-6

## Future Enhancements

- Authentication (NextAuth.js)
- Real-time updates (Pusher/Socket.io)
- Email notifications
- Advanced reporting
- Mobile app
- Integration with calendar/email
- Real AI integration (OpenAI, Anthropic)

## License

MIT

---

Built with ❤️ for efficient sales teams

