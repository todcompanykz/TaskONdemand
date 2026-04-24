# Security and Administration Checklist

## SSH
- Disable password auth after key setup in `/etc/ssh/sshd_config`.
- Keep `PermitRootLogin no`.
- Restart ssh: `sudo systemctl restart ssh`.

## UFW
- Allow only required ports: `22, 80, 443` and project ports when needed.
- Enable firewall: `sudo ufw enable`.
- Review status: `sudo ufw status numbered`.

## Fail2Ban
- Install and enable:
  - `sudo apt install -y fail2ban`
  - `sudo systemctl enable --now fail2ban`
- Use jail for sshd with sane retry limits.

## Nginx reverse proxy
- Config files stored in `infra/nginx`.
- Route frontend `/`, backend `/api`, health `/health`.

## TLS
- Local VM demo: self-signed cert in `infra/nginx/ssl`.
- Real deployment: use certbot and replace cert/key mount.

## User and role policy
- Create least-privilege operator user.
- Use `sudo` for admin-only tasks.
- Do not run services as root where avoidable.
