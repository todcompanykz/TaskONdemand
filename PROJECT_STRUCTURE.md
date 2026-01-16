# Project Structure

## Overview

```
Todmvp/
├── apps/
│   ├── backend/                 # NestJS Backend API
│   │   ├── src/
│   │   │   ├── admin/           # Admin module
│   │   │   ├── auth/            # Authentication
│   │   │   ├── database/        # DB config & migrations
│   │   │   ├── redis/           # Redis service
│   │   │   ├── tasks/           # Task business logic
│   │   │   ├── users/           # User management
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── frontend-next/           # Next.js Frontend
│       ├── app/
│       │   ├── admin/            # Admin panel
│       │   ├── feed/            # Task feed
│       │   ├── login/           # Login page
│       │   ├── register/        # Register page
│       │   ├── tasks/
│       │   │   ├── [id]/        # Task details
│       │   │   ├── create/      # Create task
│       │   │   └── history/     # My tasks
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   └── Navbar.tsx
│       ├── contexts/
│       │   └── AuthContext.tsx
│       ├── lib/
│       │   └── api.ts           # API client
│       ├── public/              # Static assets
│       ├── Dockerfile
│       ├── package.json
│       ├── next.config.js
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── docker-compose.yml           # Full stack orchestration
├── schema.sql                   # Database schema
├── .env.example                 # Environment template
├── README.md                    # Main documentation
├── QUICKSTART.md                # Quick start guide
└── PROJECT_STRUCTURE.md         # This file
```

## Frontend Structure

### Pages (App Router)

- `/` - Root (redirects to feed or login)
- `/login` - Login page
- `/register` - Registration page
- `/feed` - Task feed (1km radius)
- `/tasks/[id]` - Task details
- `/tasks/create` - Create new task
- `/tasks/history` - User's task history
- `/admin` - Admin panel

### Components

- `Navbar` - Navigation bar with logout

### Contexts

- `AuthContext` - Authentication state management

### API Client

- `lib/api.ts` - Axios-based API client with:
  - `authApi` - Login/register
  - `tasksApi` - All task operations
  - `usersApi` - User operations
  - `adminApi` - Admin operations

## Backend Structure

### Modules

- `auth` - JWT authentication
- `users` - User management
- `tasks` - Task CRUD, claiming, completion
- `admin` - Admin operations
- `database` - TypeORM configuration
- `redis` - Redis service

### Key Files

- `tasks/tasks.service.ts` - Atomic claim logic
- `tasks/task-state-machine.ts` - State transitions
- `database/migrations/` - Database migrations

## Docker Services

All services defined in `docker-compose.yml`:

1. **postgres** - PostgreSQL + PostGIS
2. **redis** - Redis cache
3. **rabbitmq** - Message queue (not used in MVP)
4. **backend** - NestJS API
5. **frontend** - Next.js app

## Environment Variables

See `.env.example` for all variables.

Key variables:
- `DB_*` - Database configuration
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - JWT signing key
- `NEXT_PUBLIC_API_URL` - Backend URL for frontend

## Database

- Schema: `schema.sql`
- Migrations: `apps/backend/src/database/migrations/`
- PostGIS extension enabled for geospatial queries

## Styling

- **Framework**: Tailwind CSS
- **Design System**: Trust-based colors
- **Mobile-first**: Responsive, touch-friendly
- **PWA**: Manifest configured

## Build & Deploy

### Development

```bash
# Backend
cd apps/backend
npm install
npm run start:dev

# Frontend
cd apps/frontend-next
npm install
npm run dev
```

### Production (Docker)

```bash
docker compose up --build
```

## Notes

- All paths are relative to project root
- Backend and frontend are separate apps
- Docker Compose orchestrates all services
- Environment variables loaded from `.env`
