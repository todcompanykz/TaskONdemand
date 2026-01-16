# Quick Start Guide

## One-Command Launch

```bash
docker compose up --build
```

That's it! 🎉

## What Gets Started

1. **Frontend** → http://localhost:3000
2. **Backend API** → http://localhost:3001
3. **PostgreSQL** → localhost:5432
4. **Redis** → localhost:6379
5. **RabbitMQ** → http://localhost:15672

## First Steps

1. Open http://localhost:3000
2. Click "Зарегистрироваться" (Register)
3. Create an account
4. You'll be redirected to the task feed

## Creating Your First Task

1. Click "Создать задачу" (Create Task)
2. Fill in the form:
   - Short description
   - Full description
   - Reward (must be divisible by 5)
   - Urgency level
   - Location (use "Использовать текущее местоположение")
3. Click "Создать задачу"

## Claiming a Task

1. Browse tasks in the feed
2. Click on a task to view details
3. Click "Взять задачу" (Claim Task)
4. After claiming, you'll see the creator's contact info

## Troubleshooting

### Port Already in Use

If ports 3000, 3001, 5432, 6379, or 5672 are in use:

1. Edit `.env` file
2. Change port numbers:
   ```
   FRONTEND_PORT=3002
   BACKEND_PORT=3003
   DB_PORT=5433
   ```

### Services Won't Start

```bash
# Check logs
docker compose logs

# Restart everything
docker compose down
docker compose up --build
```

### Database Issues

```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up --build
```

## Stopping Services

```bash
docker compose down
```

## Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
```

## Need Help?

Check the main README.md for detailed documentation.
