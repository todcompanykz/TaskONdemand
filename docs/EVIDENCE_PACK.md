# Evidence Pack (9/9 Criteria)

This file maps each grading module to:
- implementation evidence (file links)
- verification command
- expected observable result

## 1) Intro (OS / VM)

- Evidence:
  - `infra/iac/terraform/main.tf`
  - `infra/iac/terraform/cloud-init.yaml.tftpl`
  - `infra/iac/terraform/README.md`
- Verify:
  - `cd infra/iac/terraform && terraform init && terraform validate && terraform plan`
- Expected:
  - Plan shows VM, firewall, SSH key resources.

## 2) Security and network

- Evidence:
  - `infra/iac/ansible/playbooks/site.yml`
  - `infra/nginx/conf.d/default.conf`
  - `infra/security/fail2ban/jail.local`
  - `docs/SECURITY_HARDENING.md`
- Verify:
  - `sudo ufw status verbose`
  - `sudo fail2ban-client status sshd`
  - `curl -k https://localhost/health`
- Expected:
  - Firewall active, fail2ban active, HTTPS endpoint responds.

## 3) Database

- Evidence:
  - `docker-compose.yml` (loopback DB bind)
  - `infra/docker/docker-compose.base.yml`
  - `schema.sql`
  - `apps/backend/src/database/migrations/`
  - `docs/DB_ACCESS_POLICY.md`
- Verify:
  - `docker compose exec backend npm run migration:run`
  - `docker compose exec postgres psql -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-tod} -c "\dt"`
- Expected:
  - Migrations succeed and schema/tables are present.

## 4) App (Backend + Frontend + DB integration)

- Evidence:
  - `apps/backend/`
  - `apps/frontend-next/`
  - `apps/frontend-next/lib/api.ts`
- Verify:
  - `curl http://localhost:3001/health`
  - Open `http://localhost/` (full stack) or `http://localhost:3000` (minimal stack)
- Expected:
  - Backend healthy and frontend reachable.

## 5) Containerization

- Evidence:
  - `docker-compose.yml`
  - `infra/docker/docker-compose.base.yml`
  - `infra/docker/docker-compose.full.yml`
- Verify:
  - `docker compose up -d --build`
  - `docker compose ps`
- Expected:
  - Services are running and healthy.

## 6) Version control and GitHub

- Evidence:
  - `.github/workflows/ci.yml`
  - `.gitignore`
- Verify:
  - Open GitHub Actions tab for repository
- Expected:
  - CI pipeline green on push/PR.

## 7) Monitoring and alerts

- Evidence:
  - `infra/monitoring/prometheus.yml`
  - `infra/monitoring/alerts.yml`
  - `infra/monitoring/alertmanager.yml`
  - `infra/n8n/workflows/infra-alert-to-telegram.json`
  - `docs/MONITORING_RUNBOOK.md`
- Verify:
  - `curl http://localhost:9090/-/ready`
  - `curl http://localhost:9093/-/ready`
  - Stop backend (`docker stop tod-backend`) and wait for alert
- Expected:
  - Alert visible in Prometheus/Alertmanager and delivered to Telegram.

## 8) Intelligent layer (AI assistant)

- Evidence:
  - `infra/docker/docker-compose.automation.yml` (`opal` + `n8n`)
  - `infra/n8n/workflows/ai-assistant-query.json`
  - `docs/AUTOMATION_AI_IAC.md`
- Verify:
  - `curl -X POST http://localhost/n8n/webhook/ai-assistant -H "Content-Type: application/json" -d "{\"prompt\":\"infra summary\"}"`
- Expected:
  - JSON response with `answer`, `model`, and `trace`.

## 9) IaC and automation

- Evidence:
  - `infra/iac/terraform/`
  - `infra/iac/ansible/playbooks/site.yml`
  - `scripts/preflight.ps1`
  - `scripts/verify.ps1`
  - `scripts/backup.ps1`
  - `scripts/restore.ps1`
- Verify:
  - `powershell -ExecutionPolicy Bypass -File scripts/preflight.ps1`
  - `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`
- Expected:
  - Environment checks pass and service health checks succeed.
