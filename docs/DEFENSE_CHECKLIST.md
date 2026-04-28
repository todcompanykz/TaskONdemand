# Defense Checklist (Mapping to Grading Criteria)

Primary references:
- Evidence: `docs/EVIDENCE_PACK.md`
- Demo timeline: `docs/DEMO_SCRIPT.md`

## 1) Linux VM
- Ubuntu Server VM created and accessible by SSH.
- Evidence: VM info screenshot + `uname -a`.

## 2) Security and administration
- SSH hardened, UFW enabled, Fail2Ban active.
- Nginx reverse proxy enabled with TLS config.
- Backup/restore scripts: `scripts/backup.ps1`, `scripts/restore.ps1`.

## 3) Database
- PostgreSQL running in Docker with credential-based access.
- Migrations from `apps/backend/src/database/migrations`.

## 4) Web application
- Backend: `apps/backend` (NestJS).
- Frontend: `apps/frontend-next` (Next.js/TypeScript).

## 5) Containerization
- Base stack: `infra/docker/docker-compose.base.yml`.
- Security/monitoring/automation compose layers available.

## 6) Version control
- Git repo active.
- Publish remote GitHub repo and capture URL.

## 7) Monitoring and CI/CD
- Prometheus/Grafana/exporters: `infra/docker/docker-compose.monitoring.yml`.
- Jenkins pipeline: `infra/jenkins/Jenkinsfile`.

## 8) AI and n8n
- n8n service: `infra/docker/docker-compose.automation.yml`.
- Workflows: `infra/n8n/workflows`.

## 9) IaC
- Terraform provisioning: `infra/iac/terraform`.
- Ansible playbook: `infra/iac/ansible/playbooks/site.yml`.

## Demo command pack
1. `docker compose -f infra/docker/docker-compose.base.yml up -d --build`
2. `docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.monitoring.yml --profile monitoring up -d`
3. `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`
