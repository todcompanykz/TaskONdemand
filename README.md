# Task on Demand (ToD) - MVP

Local task matching service for Astana. Full-stack MVP with one-command deployment.

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git

### One-Command Launch

```bash
docker compose up --build
```

This starts:
- ✅ Frontend (Next.js) - http://localhost:3000
- ✅ Backend (NestJS) - http://localhost:3001
- ✅ PostgreSQL + PostGIS - localhost:5432
- ✅ Redis - localhost:6379
- ✅ RabbitMQ - localhost:5672 (Management: http://localhost:15672)

### First Time Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your settings (optional, defaults work for local dev)

3. Start services:
   ```bash
   docker compose up --build
   ```

4. Wait for services to be healthy (check logs)

5. Access:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - RabbitMQ Management: http://localhost:15672 (admin/admin)

## 📁 Project Structure

```
.
├── apps/
│   ├── backend/          # NestJS API
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── frontend-next/    # Next.js Frontend
│       ├── app/
│       ├── components/
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml    # Full stack orchestration
├── schema.sql            # Database schema
└── .env.example          # Environment template
```

## 🎨 Frontend Features

### Screens

- **Login / Register** - Email + password authentication
- **Task Feed** - Tasks within 1km radius (uses geolocation)
- **Task Details** - View, claim, cancel, complete tasks
- **Create Task** - Form with validation
- **My Tasks** - History of created and claimed tasks
- **Admin Panel** - View users, tasks, statistics

### Design

- **Trust-based UI**: Blue/blue-green primary colors
- **Mobile-first**: PWA-ready, touch-friendly
- **Simple & Clean**: No flashy gradients, high contrast
- **Color Psychology**:
  - Primary: Blue (#2563EB) - Trust, safety
  - Success: Green - Completion
  - Warning: Amber - Urgency
  - Danger: Red - Destructive actions only

## 🔧 Backend API

### Endpoints

**Authentication**
- `POST /auth/register` - Register
- `POST /auth/login` - Login

**Tasks**
- `GET /tasks/feed?longitude=X&latitude=Y` - Get tasks within 1km
- `GET /tasks/:id` - Get task details
- `POST /tasks` - Create task
- `POST /tasks/claim` - Claim task (atomic)
- `POST /tasks/:id/cancel` - Cancel task
- `POST /tasks/:id/refuse` - Refuse task
- `POST /tasks/:id/confirm-work` - Confirm work completed
- `POST /tasks/:id/confirm-payment` - Confirm payment received
- `GET /tasks/history` - Get user history

**Users**
- `GET /users/me` - Get current user

**Admin**
- `GET /admin/users` - List users
- `GET /admin/tasks` - List tasks
- `GET /admin/stats` - Statistics
- `DELETE /admin/tasks/:id` - Delete task

## 🗄️ Database

PostgreSQL with PostGIS extension for geospatial queries.

### Schema

- **users**: Email, password, phone number
- **tasks**: Description, reward, location (PostGIS), status, urgency

### Migrations

Schema is auto-applied on first startup via `schema.sql` in docker-entrypoint-initdb.d.

## 🔐 Security

- JWT authentication (7-day tokens)
- Password hashing (bcrypt)
- Atomic task claiming (prevents race conditions)
- Rate limiting (Redis) - max 3 cancels/refusals per 24h

## 🛠️ Development

### Local Development (Without Docker)

**Backend:**
```bash
cd apps/backend
npm install
npm run start:dev
```

**Frontend:**
```bash
cd apps/frontend-next
npm install
npm run dev
```

**Database:**
```bash
docker compose up postgres redis
```

### Environment Variables

See `.env.example` for all available variables.

Key variables:
- `JWT_SECRET` - Must be set in production (min 32 chars)
- `DB_PASSWORD` - Database password
- `NEXT_PUBLIC_API_URL` - Backend API URL for frontend

## 📱 PWA Support

Frontend is PWA-ready:
- Installable on mobile
- Offline-capable (basic)
- Manifest configured
- Theme color set

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js app |
| Backend | 3001 | NestJS API |
| PostgreSQL | 5432 | Database with PostGIS |
| Redis | 6379 | Cache & rate limiting |
| RabbitMQ | 5672 | Message queue (not used in MVP) |
| RabbitMQ Mgmt | 15672 | Management UI |

## 🔍 Health Checks

All services have health checks. Check status:

```bash
docker compose ps
```

## 📊 Monitoring

- Backend logs: `docker compose logs -f backend`
- Frontend logs: `docker compose logs -f frontend`
- All logs: `docker compose logs -f`

## 🚨 Troubleshooting

### Services won't start

1. Check ports are available:
   ```bash
   netstat -an | grep -E '3000|3001|5432|6379'
   ```

2. Check Docker logs:
   ```bash
   docker compose logs
   ```

### Database connection errors

- Wait for PostgreSQL to be healthy (check `docker compose ps`)
- Verify credentials in `.env`

### Frontend can't connect to backend

- Check `NEXT_PUBLIC_API_URL` in `.env`
- Verify backend is running: `curl http://localhost:3001`

## 📝 Notes

- **MVP Only**: No payments, chats, ratings, or profiles
- **Astana Focus**: Default coordinates set to Astana center
- **1km Radius**: Fixed radius for task feed (not configurable)
- **24h Expiration**: Tasks expire after 24 hours

## 📄 License

Private - MVP for startup

## 🤝 Support

For issues or questions, check the logs first:
```bash
docker compose logs
```
