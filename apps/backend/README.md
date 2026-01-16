# Task on Demand (ToD) - Backend API

MVP backend for a local task matching service in Astana.

## Tech Stack

- **Framework**: NestJS (Node.js, TypeScript)
- **Database**: PostgreSQL + PostGIS
- **Cache**: Redis
- **Message Queue**: RabbitMQ (structure only, not used in MVP)
- **Storage**: AWS S3 (structure only, not used in MVP)

## Core Features

- Authentication (email/password, phone storage)
- Task creation with geolocation (PostGIS)
- Task feed within 1km radius
- Atomic task claiming
- Cancel/refuse with anti-abuse (max 3 per 24h)
- Completion flow (mutual confirmation)
- Task history
- Minimal admin panel

## Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL with PostGIS extension

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment file:
   ```bash
   cp .env.example .env
   ```

4. Start infrastructure services:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npm run migration:run
   ```

6. Start the development server:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login

### Tasks
- `POST /tasks` - Create task
- `GET /tasks/feed?longitude=X&latitude=Y` - Get tasks within 1km
- `GET /tasks/:id` - Get task details
- `GET /tasks/history` - Get user's task history
- `POST /tasks/claim` - Claim a task (atomic)
- `POST /tasks/:id/cancel` - Cancel task (creator only)
- `POST /tasks/:id/refuse` - Refuse task (executor only)
- `POST /tasks/:id/confirm-work` - Confirm work completed (creator)
- `POST /tasks/:id/confirm-payment` - Confirm payment received (executor)

### Users
- `GET /users/me` - Get current user profile

### Admin
- `GET /admin/users` - List all users
- `GET /admin/tasks` - List all tasks
- `GET /admin/stats` - Get statistics
- `DELETE /admin/tasks/:id` - Delete task

## Database Schema

### Users
- id (UUID)
- email (unique)
- password (bcrypt hashed)
- phoneNumber (optional)

### Tasks
- id (UUID)
- shortDescription
- fullDescription
- reward (KZT, divisible by 5)
- geoPoint (PostGIS Point)
- urgency (low/medium/high)
- status (created/claimed/completed/cancelled/expired)
- createdById
- claimedById
- customerConfirmed
- executorConfirmed
- expiresAt (24h after creation)

## Task State Machine

Valid transitions:
- `created` → `claimed`
- `created` → `cancelled` (by creator)
- `created` → `expired` (after 24h)
- `claimed` → `completed` (both confirm)
- `claimed` → `cancelled` (by creator or executor)

## Anti-Abuse

- Max 3 cancels/refusals per 24h per user
- After limit: claim blocked for 24h
- Rate limiting via Redis

## Development

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Migrations
npm run migration:generate -- -n MigrationName
npm run migration:run
npm run migration:revert
```

## License

Private - MVP for startup
