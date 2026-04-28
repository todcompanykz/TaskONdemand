# Demo Script (10-12 minutes)

## 0:00-1:00 - Context and architecture

- Show repository structure (`apps`, `infra`, `docs`, `scripts`).
- Explain that deployment runs as full stack via compose profiles.

## 1:00-2:00 - VM + IaC

- Open `infra/iac/terraform/main.tf` and `infra/iac/terraform/README.md`.
- Run:
  - `cd infra/iac/terraform`
  - `terraform validate`
- Explain outputs (`vm_public_ipv4`, SSH command).

## 2:00-3:30 - Security baseline

- Open `infra/iac/ansible/playbooks/site.yml` and `docs/SECURITY_HARDENING.md`.
- Run checks on VM:
  - `sudo ufw status verbose`
  - `sudo fail2ban-client status sshd`
  - `curl -k https://localhost/health`

## 3:30-5:00 - Database

- Open `docs/DB_ACCESS_POLICY.md` and show loopback binding (`DB_BIND_ADDRESS=127.0.0.1`).
- Run:
  - `docker compose exec backend npm run migration:run`
  - `docker compose exec postgres psql -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-tod} -c "\dt"`

## 5:00-6:30 - Application

- Open website `http://localhost/`.
- Open API root `http://localhost/api/` and health `http://localhost/health`.

## 6:30-8:30 - Monitoring + alerts

- Open Prometheus and Grafana.
- Trigger real alert:
  - `docker stop tod-backend`
- Show alert appearance in Prometheus/Alertmanager and Telegram notification.
- Recover:
  - `docker start tod-backend`

## 8:30-10:00 - AI layer

- Show `infra/docker/docker-compose.automation.yml` (`opal` + `n8n`) and AI workflow file.
- Execute:
  - `curl -X POST http://localhost/n8n/webhook/ai-assistant -H "Content-Type: application/json" -d "{\"prompt\":\"summarize infra health\"}"`
- Show response includes answer + trace.

## 10:00-11:00 - CI/CD and repo quality

- Open `.github/workflows/ci.yml`.
- Show recent green GitHub Actions run for push/PR.

## 11:00-12:00 - Backup/restore and close

- Run:
  - `powershell -ExecutionPolicy Bypass -File scripts/backup.ps1`
  - `powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -DumpFile .\\backups\\postgres_xxx.sql -DryRun`
- Close with `docs/EVIDENCE_PACK.md` as final checklist.
