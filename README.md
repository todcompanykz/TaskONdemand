# Task on Demand (ToD) - MVP

Local task matching service for Astana. Full-stack MVP with Docker deployment and an optional **production-like** profile (Nginx, Prometheus, Grafana, Alertmanager, n8n).

[![CI](https://github.com/YOUR_GH_USER/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_GH_USER/YOUR_REPO/actions/workflows/ci.yml)

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose **v2.24+** (for `include` in the full stack file; see fallback below)
- Git

### Minimal stack (apps + data only)

```bash
docker compose up --build
```

This starts:
- Frontend (Next.js) — `http://localhost:${FRONTEND_PORT:-3000}`
- Backend (NestJS) — `http://localhost:${BACKEND_PORT:-3001}`
- PostgreSQL + PostGIS — `localhost:${DB_PORT:-5432}`
- Redis — `localhost:6379`
- RabbitMQ — `5672` (management UI: `http://localhost:15672`)

### Full stack (Nginx + monitoring + n8n)

From the repo root, after `cp .env.example .env` and filling secrets:

```bash
docker compose --env-file .env -f infra/docker/docker-compose.full.yml --profile monitoring --profile automation up -d --build
```

Expose paths when Nginx (**port 80/443**) is up:

| Path | Service |
|------|---------|
| `/` | Next.js frontend |
| `/api/` | NestJS API |
| `/health` | Health check |
| `/metrics` | Prometheus metrics |
| `/grafana/` | Grafana (set `GRAFANA_ROOT_URL`, see `env/.env.monitoring.example`) |
| `/n8n/` | n8n automation |

**Compose without `include`:** use the long form in [docs/INFRA_SETUP.md](docs/INFRA_SETUP.md) (multiple `-f` files + `--profile monitoring --profile automation`).

**Detailed guides:** [docs/INFRA_SETUP.md](docs/INFRA_SETUP.md) · [docs/DEFENSE_CHECKLIST.md](docs/DEFENSE_CHECKLIST.md) · [docs/EVIDENCE_PACK.md](docs/EVIDENCE_PACK.md) · [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) · [docs/AUTOMATION_AI_IAC.md](docs/AUTOMATION_AI_IAC.md) · [docs/DB_ACCESS_POLICY.md](docs/DB_ACCESS_POLICY.md) · [docs/MONITORING_RUNBOOK.md](docs/MONITORING_RUNBOOK.md)

### First Time Setup

1. Copy environment file:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your settings (recommended for local/VPS reproducibility)

3. Start services:
   ```bash
   docker compose up --build
   ```

4. Wait for services to be healthy (check logs)

5. Access:
   - Frontend: `http://localhost:${FRONTEND_PORT}`
   - Backend API: `http://localhost:${BACKEND_PORT}`
   - Backend health: `http://localhost:${BACKEND_PORT}/health`
   - RabbitMQ Management: http://localhost:15672 (admin/admin)

## 📁 Project structure

```
.
├── apps/
│   ├── backend/                 # NestJS API (canonical backend — use this path)
│   └── frontend-next/           # Next.js frontend
├── infra/
│   ├── docker/                  # Modular compose + docker-compose.full.yml
│   ├── nginx/                   # Reverse proxy configs (TLS under infra/nginx/ssl)
│   ├── monitoring/              # Prometheus, Alertmanager, Grafana provisioning
│   ├── n8n/workflows/           # n8n exports (alerts, AI)
│   ├── security/                # e.g. fail2ban jail samples
│   └── iac/                     # terraform/ (starter), ansible/ (UFW baseline)
├── docs/                        # Infra, security, automation
├── scripts/                     # TLS, backup, telegram_notify.sh, preflight, verify
├── docker-compose.yml           # Minimal local stack (no Nginx/monitoring)
├── schema.sql                   # Initial DB for empty Postgres volume
└── .env.example
```

Application code lives only under **`apps/`**. Older duplicate trees at the repo root were removed to avoid confusion.

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

- **New empty volume:** Postgres runs scripts in `docker-entrypoint-initdb.d` (see compose), including `schema.sql`.
- **Application upgrades:** On startup the NestJS process runs TypeORM migrations from `apps/backend/src/database/migrations/` (see `apps/backend/src/main.ts`). For a manual run inside the backend container: `npm run migration:run` (working directory `/app` or `apps/backend` depending on image layout).

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

See `.env.example` for all available variables used by `docker-compose.yml`.

Key variables:
- `JWT_SECRET` - Must be set in production (min 32 chars)
- `DB_*` - Database credentials and host port mapping
- `DB_BIND_ADDRESS` - DB host bind address, default `127.0.0.1` for safer local/prod baseline
- `FRONTEND_PORT` / `BACKEND_PORT` - Exposed app ports
- `FRONTEND_URL` - Allowed frontend origin for backend CORS

## ✅ CI Status

GitHub Actions workflow: `.github/workflows/ci.yml`

Pipeline includes:
- backend lint/test/build
- frontend lint/build
- docker compose smoke health check (`/health`)

Before publishing, replace `YOUR_GH_USER/YOUR_REPO` in the badge URL with your actual repository.

## 📱 PWA Support

Frontend is PWA-ready:
- Installable on mobile
- Offline-capable (basic)
- Manifest configured
- Theme color set

## 🐳 Docker services

| Service | Port (default) | Description |
|---------|----------------|-------------|
| Frontend | `${FRONTEND_PORT:-3000}` | Next.js |
| Backend | `${BACKEND_PORT:-3001}` | NestJS; exposes `/health`, `/metrics` |
| PostgreSQL | `${DB_PORT:-5432}` | PostGIS |
| Redis | `${REDIS_PORT:-6379}` | Cache & rate limits |
| RabbitMQ | `${RABBITMQ_PORT:-5672}` | Broker |
| RabbitMQ Mgmt | `${RABBITMQ_MANAGEMENT_PORT:-15672}` | UI |

**Full infra profile** (see `infra/docker/docker-compose.monitoring.yml` and `docker-compose.security.yml`):

| Service | Port (default) | Description |
|---------|----------------|-------------|
| Nginx | `80`, `443` | Reverse proxy to app, Grafana, n8n |
| Prometheus | `${PROMETHEUS_PORT:-9090}` | Scrapes node-exporter, cAdvisor, backend `/metrics` |
| Alertmanager | `${ALERTMANAGER_PORT:-9093}` | Delivers alerts (default webhook → n8n) |
| Grafana | `${GRAFANA_PORT:-3010}` → container `3000` | **3010** avoids clashing with frontend **3000** |
| node-exporter | `${NODE_EXPORTER_PORT:-9100}` | Host metrics |
| cAdvisor | `${CADVISOR_PORT:-8089}` | Container metrics (8089 on host avoids Windows port 8080 conflicts) |
| n8n | `${N8N_PORT:-5678}` | Workflows orchestration (alerts + AI webhook) |
| opal (LiteLLM gateway) | `${OPAL_PORT:-4000}` | OpenAI-compatible AI proxy for n8n |

## 🔍 Health checks

```bash
docker compose ps
```

## 📊 Monitoring and alerts

- **Logs:** `docker compose logs -f backend` (and other service names).
- **Metrics:** Prometheus scrapes `http://backend:3001/metrics` on the Docker network.
- **Dashboards:** Grafana datasource is provisioned from `infra/monitoring/grafana/provisioning/`.
- **Telegram:**
  - Import `infra/n8n/workflows/infra-alert-to-telegram.json` into n8n and set `TELEGRAM_*` env vars; Alertmanager posts to `/webhook/infra-alert` by default (`infra/monitoring/alertmanager.yml`).
  - Or call `scripts/telegram_notify.sh` from cron/CI with the same env vars.

**IaC:** Ansible playbook for UFW baseline: `infra/iac/ansible/playbooks/site.yml`. Terraform under `infra/iac/terraform/` is a **local starter** only — see `infra/iac/terraform/README.md`.

## 🚨 Troubleshooting

### Services won't start

1. Check ports are available:
   ```bash
   # Linux/macOS
   ss -lntp | grep -E '3000|3001|5432|6379|5672|15672'

   # Windows PowerShell
   Get-NetTCPConnection -State Listen | Where-Object { $_.LocalPort -in 3000,3001,3010,5432,5672,6379,8080,8089,9100,9090,9093,15672 }
   ```

2. Check Docker logs:
   ```bash
   docker compose logs
   ```

3. **Port 8080 already in use** (cAdvisor): set `CADVISOR_PORT=8089` in `.env` or use the new default after pulling latest `docker-compose.monitoring.yml`.

4. **Container name already in use** (`Conflict. The container name "/tod-..." is already in use`): the same fixed names (`tod-postgres`, `tod-rabbitmq`, …) are used by both the root `docker-compose.yml` and `infra/docker/docker-compose.*.yml`. Only one stack can run at a time. Remove the old containers, then start again:
   ```powershell
   docker rm -f (docker ps -aq --filter name=tod-)
   ```
   Or: `docker compose -f <the-compose-file-you-used-before> down` (same path you used when the old stack was created).

### Database connection errors

- Wait for PostgreSQL to be healthy (check `docker compose ps`)
- Verify credentials in `.env`

### Frontend can't connect to backend

- Check backend CORS origin via `FRONTEND_URL` in `.env`
- Verify backend is running: `curl http://localhost:${BACKEND_PORT}/health`

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
