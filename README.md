# Team Task Manager

A full-stack web application for team project and task management with role-based access control.

## Live Demo

**Deployed on Railway:** [https://teamtaskmanager-production.up.railway.app](https://teamtaskmanager-production.up.railway.app)

## Features

- **Authentication**: Secure signup/login with JWT tokens
- **Project Management**: Create projects, invite team members, manage access
- **Task Management**: Create, assign, and track tasks with status updates (To Do, In Progress, Done)
- **Dashboard**: Visual overview of tasks, statuses, overdue items, and project progress
- **Role-Based Access**: Admin and Member roles at both global and project levels
- **Responsive UI**: Works on desktop and mobile

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS, React Router
- **Auth**: JWT (JSON Web Tokens), bcryptjs
- **Deployment**: Railway

## Database Schema

```
User ──┬──< Project (as owner)
       ├──< ProjectMember (as member)
       ├──< Task (as assignee)
       └──< Task (as creator)

Project ──┬──< ProjectMember
          └──< Task
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Install
```bash
git clone <repo-url>
cd teamtaskmanager
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Variables
Create `backend/.env`:
```
DATABASE_URL="postgresql://user:password@localhost:5432/teamtaskmanager"
JWT_SECRET="your-secret-key"
PORT=5001
```

### 3. Database Setup
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Run Development
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The app will be available at `http://localhost:5173` (frontend dev server) which proxies to the backend.

### 5. Build for Production
```bash
cd frontend && npm run build
cd ../backend && npm start
```

The backend serves the built frontend at `http://localhost:5001`.

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - List my projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `DELETE /api/projects/:id` - Delete project (admin only)
- `POST /api/projects/:id/members` - Add member by email
- `DELETE /api/projects/:id/members/:userId` - Remove member

### Tasks
- `GET /api/projects/:projectId/tasks` - List tasks (with filters)
- `POST /api/projects/:projectId/tasks` - Create task
- `GET /api/tasks/:id` - Get task details
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard` - Get stats and overview

## Role-Based Access

| Action | Who Can Do It |
|--------|---------------|
| Delete Project | Project Owner / Global Admin |
| Manage Members | Project Admin |
| Create/Edit Tasks | Any Project Member |
| Delete Task | Task Creator / Project Admin |
| Update Task Status | Assignee / Project Member |

## Deployment (Railway)

1. Push code to GitHub
2. Create new project in Railway, deploy from GitHub repo
3. Add PostgreSQL plugin (Railway auto-injects `DATABASE_URL`)
4. Add environment variable: `JWT_SECRET`
5. Railway will run `npm run build` and `npm start` automatically
6. Copy the live URL for submissions

## Environment Variables for Production

```
DATABASE_URL="postgresql://..."  # Auto-provided by Railway PostgreSQL
JWT_SECRET="strong-random-secret"
PORT=5000  # Auto-provided by Railway
```

## License

MIT
