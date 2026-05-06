# Team Task Manager

A full-stack web application for team project and task management with role-based access control.

## Features

- **Authentication**: Secure signup/login with JWT tokens
- **Project Management**: Create projects, invite team members, manage access
- **Task Management**: Create, assign, and track tasks with status updates
- **Dashboard**: Visual overview of tasks, statuses, and overdue items
- **Role-Based Access**: Admin and Member roles at both global and project levels

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM, PostgreSQL
- **Frontend**: React, Vite, Tailwind CSS
- **Auth**: JWT (JSON Web Tokens)
- **Deployment**: Railway

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL

### Backend Setup
```bash
cd backend
npm install
# Set DATABASE_URL and JWT_SECRET in .env
npx prisma migrate dev
npm run dev
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="postgresql://user:password@localhost:5432/teamtaskmanager"
JWT_SECRET="your-secret-key"
PORT=5000
```

## Deployment

The app is deployed on Railway with a PostgreSQL database.

## Demo

[Live URL](https://your-railway-app.up.railway.app)

## License

MIT
