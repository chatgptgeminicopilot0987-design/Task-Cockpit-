# TaskCockpit

A full-stack team task management application built with React, Express, and PostgreSQL.

![TaskCockpit](attached_assets/opengraph.jpg)

## Features

- **Authentication** — JWT-based signup and login with role-based access (Admin / Member)
- **Projects** — Create, edit, and delete projects with deadlines and progress tracking
- **Kanban Board** — Visual task management with To Do, In Progress, and Completed columns
- **Tasks** — Full task lifecycle with title, description, priority, assignee, deadline, and status
- **Team Members** — Add and remove project members directly from the project or task page
- **Comments** — Per-task discussion thread
- **Dashboard** — Overview of stats, recent activity, and assigned tasks
- **Drizzle Studio** — Visual database browser

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS v4, shadcn/ui, TanStack Query, Wouter |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL, Drizzle ORM |
| Auth | JWT, bcryptjs |
| Monorepo | pnpm workspaces |
| Deployment | Railway |

## Project Structure

```
├── artifacts/
│   ├── api-server/          # Express REST API
│   └── team-task-manager/   # React frontend
├── lib/
│   ├── db/                  # Drizzle ORM schema & client
│   ├── api-spec/            # OpenAPI spec
│   ├── api-zod/             # Zod validators (generated)
│   └── api-client-react/    # React Query hooks (generated)
└── scripts/                 # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 9+
- PostgreSQL 14+

### Local Development

1. **Clone the repo**
   ```bash
   git clone https://github.com/your-username/Task-Cockpit-.git
   cd Task-Cockpit-
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   Copy `.env` and fill in your values:
   ```env
   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/team_task_manager
   JWT_SECRET=your-secret-key
   PORT=8080
   NODE_ENV=development
   ```

4. **Push database schema**
   ```bash
   cd lib/db
   pnpm run push
   ```

5. **Start the API server**
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```

6. **Start the frontend** (in a new terminal)
   ```bash
   pnpm --filter @workspace/team-task-manager run dev
   ```

7. Open [http://localhost:18739](http://localhost:18739)

### Drizzle Studio

To browse your database visually:
```bash
cd lib/db
pnpm run studio
```
Then open [https://local.drizzle.studio](https://local.drizzle.studio)

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:userId` | Remove member |
| GET | `/api/projects/:id/tasks` | List project tasks |
| POST | `/api/projects/:id/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/my` | Get my tasks |
| GET | `/api/dashboard` | Dashboard stats |

## Deployment

The app is deployed on [Railway](https://railway.app).

**Environment variables required:**
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
PORT=8080
NODE_ENV=production
```

**Live URL:** [task-cockpit-production.up.railway.app](https://task-cockpit-production.up.railway.app)

## License

MIT
