# Infrastructure Setup Guide (Linux VM)

## 1. Prepare environment files
- Copy `env/.env.vm.example` to `.env`.
- Fill `FRONTEND_URL`, `JWT_SECRET`, and admin passwords.

## 2. Preflight checks
- On Windows host: `powershell -ExecutionPolicy Bypass -File scripts/preflight.ps1`
- On Linux VM: ensure Docker and Compose plugin are installed.

## 3. Start base stack
```bash
docker compose -f infra/docker/docker-compose.base.yml up -d --build
```

## 4. Start security edge
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.security.yml up -d
```

## 5. Start monitoring profile
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.monitoring.yml --profile monitoring up -d
```

## 6. Start automation profile (n8n)
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.automation.yml --profile automation up -d
```

## 7. Verify runtime
- `docker compose -f infra/docker/docker-compose.base.yml ps`
- `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`

## 8. Backup and restore
- Backup: `powershell -ExecutionPolicy Bypass -File scripts/backup.ps1`
- Restore: `powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -DumpFile .\\backups\\postgres_xxx.sql`
