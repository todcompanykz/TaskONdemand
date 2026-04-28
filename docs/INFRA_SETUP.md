# Infrastructure Setup Guide (Linux VM)

## 0. Provision VM with Terraform (recommended)

From repository root:

```bash
cd infra/iac/terraform
cp terraform.tfvars.example terraform.tfvars
```

Fill `terraform.tfvars` (`hcloud_token`, `ssh_public_key`, `allowed_ssh_cidr`), then:

```bash
terraform init
terraform validate
terraform plan
terraform apply
```

Save the output `vm_public_ipv4`, then connect:

```bash
ssh todadmin@<vm_public_ipv4>
```

cloud-init installs Docker/Compose plugin, enables UFW and Fail2Ban baseline automatically.

## 1. Prepare environment files
- Copy `env/.env.vm.example` to `.env`.
- Fill `FRONTEND_URL`, `JWT_SECRET`, and admin passwords.

## 2. Preflight checks
- On Windows host: `powershell -ExecutionPolicy Bypass -File scripts/preflight.ps1`
- On Linux VM: ensure Docker and Compose plugin are installed.
- **Docker Desktop (Windows/macOS):** `node-exporter` uses a root bind mount without `rslave` so the stack can start. Host metrics inside the container reflect the Docker VM, not the physical Windows host; for real bare-metal metrics run the stack on a Linux server or add a `docker-compose.override.yml` with `pid: host` and `,rslave` on that mount.

## 3. One-shot full stack (recommended)

From the repository root, with `.env` present (merge variables from `env/.env.vm.example`, `env/.env.monitoring.example`, and n8n/AI vars as needed):

```bash
docker compose --env-file .env -f infra/docker/docker-compose.full.yml --profile monitoring --profile automation up -d --build
```

This includes Nginx, Prometheus, Alertmanager, Grafana, and n8n. Ensure `GRAFANA_PORT` (default **3010** in `docker-compose.monitoring.yml`) does not conflict with `FRONTEND_PORT`.

If your Docker Compose version does not support `include` (Compose **v2.24+**), use the layered files explicitly:

```bash
docker compose --env-file .env \
  -f infra/docker/docker-compose.base.yml \
  -f infra/docker/docker-compose.security.yml \
  -f infra/docker/docker-compose.monitoring.yml \
  -f infra/docker/docker-compose.automation.yml \
  --profile monitoring --profile automation up -d --build
```

TLS for Nginx: without `infra/nginx/ssl/server.crt` and `server.key`, the container **will not start** (HTTPS block in `default.conf`). Generate them once, e.g. Git Bash: `bash scripts/generate-self-signed-tls.sh`, or: `docker run --rm -v "$(pwd)/infra/nginx/ssl:/out" alpine/openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /out/server.key -out /out/server.crt -subj "/CN=localhost"`.

## 4. Start base stack only
```bash
docker compose -f infra/docker/docker-compose.base.yml up -d --build
```

## 5. Start security edge
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.security.yml up -d
```

## 6. Start monitoring profile
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.monitoring.yml --profile monitoring up -d
```

## 7. Start automation profile (n8n)
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.automation.yml --profile automation up -d
```

## 8. Verify runtime
- `docker compose -f infra/docker/docker-compose.base.yml ps`
- `powershell -ExecutionPolicy Bypass -File scripts/verify.ps1`

## 9. Backup and restore
- Backup (14 days retention by default): `powershell -ExecutionPolicy Bypass -File scripts/backup.ps1`
- Custom retention: `powershell -ExecutionPolicy Bypass -File scripts/backup.ps1 -RetentionDays 30`
- Restore dry-run: `powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -DumpFile .\\backups\\postgres_xxx.sql -DryRun`
- Restore apply: `powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -DumpFile .\\backups\\postgres_xxx.sql`

## 10. Security baseline verification
- SSH hardening:
  - `sudo grep -E 'PasswordAuthentication|PermitRootLogin|PubkeyAuthentication' /etc/ssh/sshd_config`
  - Expected: `PasswordAuthentication no`, `PermitRootLogin no`, `PubkeyAuthentication yes`
- Firewall:
  - `sudo ufw status verbose`
  - Expected inbound only on `22`, `80`, `443`
- Fail2Ban:
  - `sudo fail2ban-client status`
- TLS:
  - `curl -k https://localhost/health`
