# Clarity CRM

A clean, functional CRM MVP built with Next.js, TypeScript, Tailwind CSS, and Prisma / SQLite.
## Goals
Build a single-page application, including backend logic, to support the following use case:
Sales Lead Overview + supporting data creation (CRM Application).

### As a sales lead:
- I can see what my team is busy with this week ✅
- I can evaluate whether someone from my team has free capacities or not ✅
- I can  judge the performance of my team members ✅
- I can ensure during someone’s absence measures can be taken (e.g. a task can be handed over to another colleague) ✅
### As any employee: 
- I can log my activities ✅ 
- I can plan my tasks ✅
Bonus: 
Think of an AI functionality which would support the Head of Sales / Sales Lead with his daily work


## What challenges and thoughts did I face during this project?

- Setting up a proper development pipeline with GitHub took some trial and error.

- I initially struggled with the "create" operations — the trial-and-error phase was long, but once I added basic test coverage, things became much smoother.

- Finding the right "trust the AI" vs. "don’t trust the AI" balance was tricky. Many features were generated quickly after the initial MVP prompt, but quite a few didn’t work out of the box. Fixing and cleaning them up took time.

- Managing dummy data and its relationships turned out to be more challenging than expected.

- This new way of working required rethinking how to structure and iterate on the project e.g., when to ingest test data, how much content to include in the first prompts, and when to refine features.

- There’s a natural tension between a Product Management mindset (discovery, understanding the problem space, etc.) and the desire to move fast with prototyping. I’m still finding the right balance.

- Estimating how long a feature will take is difficult at this stage — the learning curve is steep, but that’s part of the process.

## What would I add with more time?

- Advanced access and authentication

- Integration with email, calendar, and marketing automation tools

- A dedicated mobile app

- Improved user and role concepts

- Additional AI-driven automation (e.g., task creation)

- CRM-AI “Selly”: a conversational assistant acting as a senior business analyst and facilitator for the team, with a human-in-the-loop approach (the team defines internal rules, instructions, and data sources)



## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Prisma with SQLite
- **Testing**: Unit Test, Intergration Tests, Playwright Test
- **UI Design**: Clean, minimal design inspired by Linear, Notion, and Apple

## Features:
### For Sales Leads
- **Team Overview Dashboard**: See what the team is working on
- **Capacity Monitoring**: Check who has free capacity
- **Performance KPIs**: Evaluate team performance
- **Agent Details**: Drill into individual sales agent details
- **Task Reassignment**: Reassign tasks during absences
- **AI Insights**: Get AI-powered team performance insights and recommendations (Draft)
### For All Agents
- **Activity Logging**: Log calls, meetings, emails, and notes
- **Task Planning**: Plan and track daily tasks
- **Call Notes**: Take detailed call notes with AI summary generation
- **Performance Tracking**: View personal statistics and metrics



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



Tests use a separate SQLite database (`prisma/test.db`) configured in `.env.test` to avoid conflicts with dev data.


