# Security and Administration Checklist

## SSH
- Ansible baseline applies:
  - `PasswordAuthentication no`
  - `PermitRootLogin no`
  - `PubkeyAuthentication yes`
- Manual verification:
  - `sudo sshd -t`
  - `sudo grep -E 'PasswordAuthentication|PermitRootLogin|PubkeyAuthentication' /etc/ssh/sshd_config`
  - `sudo systemctl status ssh`

## UFW
- Allow only `22`, `80`, `443` inbound by default.
- Defaults:
  - incoming: deny
  - outgoing: allow
- Verification:
  - `sudo ufw status verbose`
  - `sudo ufw status numbered`

Do not expose internal service ports (`5432`, `6379`, `5672`, `15672`) publicly on production VM.

## Fail2Ban
- Install and enable:
  - `sudo apt install -y fail2ban`
  - `sudo systemctl enable --now fail2ban`
- Use jail for sshd with sane retry limits.
- Verification:
  - `sudo fail2ban-client status`
  - `sudo fail2ban-client status sshd`

## Nginx reverse proxy
- Config files stored in `infra/nginx`.
- Route frontend `/`, backend `/api`, health `/health`.

## TLS
- Local VM demo: self-signed cert in `infra/nginx/ssl`.
- Real deployment: use certbot and replace cert/key mount.
- Verification:
  - `curl -k https://localhost/health`
  - `openssl x509 -in infra/nginx/ssl/server.crt -noout -subject -dates`

## Backup policy
- Schedule: daily backup via `scripts/backup.ps1` (Task Scheduler on Windows runner or cron-compatible wrapper on Linux).
- Retention: 14 days by default (`-RetentionDays`).
- Integrity: script writes SHA256 manifest for DB dump and config archive.
- Restore tests:
  - Weekly dry-run: `powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -DumpFile .\\backups\\postgres_xxx.sql -DryRun`
  - Monthly full restore on staging: `powershell -ExecutionPolicy Bypass -File scripts/restore.ps1 -DumpFile .\\backups\\postgres_xxx.sql`

## User and role policy
- Create least-privilege operator user.
- Use `sudo` for admin-only tasks.
- Do not run services as root where avoidable.
