# Clarity CRM

A clean, functional CRM MVP built with Next.js, TypeScript, Tailwind CSS, and Prisma.
## Goals
Build a single-page application, including backend logic, to support the following use case:
Sales Lead Overview + supporting data creation (CRM Application).
As a sales lead:
I can see what my team is busy with this week
I can evaluate whether someone from my team has free capacities or not
I can  judge the performance of my team members
I can ensure during someone’s absence measures can be taken (e.g. a task can be handed over to another colleague)
As any employee: 
I can log my activities
I can plan my tasks
Bonus: 
Think of an AI functionality which would support the Head of Sales / Sales Lead with his daily work






## Features

### For Sales Leads
- **Team Overview Dashboard**: See what the team is working on
- **Capacity Monitoring**: Check who has free capacity
- **Performance KPIs**: Evaluate team performance
- **Agent Details**: Drill into individual sales agent details
- **Task Reassignment**: Reassign tasks during absences
- **AI Insights**: Get AI-powered team performance insights and recommendations

### For All Agents
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


## What challenges and thoughts did I face during this project?
- My "development pipline" with git-hub.
- "Trust the AI" / "Don't trust the AI" - Balance
- This new way of working also leads to a rethink about how to approach such a project. When to do what, while iterating over new features and improvements is a challenge. E.g. when to ingest test/dummy-data. 
- How much time to I need for a feature. Hard to predict right now.

## What would I add with more time?
- Advanced Access & Authentification
- Integration of email, calendar and marketing automation
- dedicated mobile app
- Further AI automation such as task creating
- AI chat "Selly" to support the Sales Team.

## Testing

The project includes comprehensive test coverage with unit, component, and API integration tests using Vitest.

### Setup Test Environment

```bash
# Install dependencies (if not already installed)
npm install

# Prepare test database (creates prisma/test.db)
npm run test:prepare

# Seed minimal test data
npm run test:reset
```

### Running Tests

```bash
# Run all tests once
npm test

# Watch mode (re-runs on file changes)
npm run test:watch

# Interactive UI test runner
npm run test:ui
```

### Test Coverage

- **Unit tests**: Validation schemas (Zod)
- **Component tests**: Forms for deals and tasks creation
- **API Integration tests**: Deal creation endpoint with database

Tests use a separate SQLite database (`prisma/test.db`) configured in `.env.test` to avoid conflicts with dev data.


