# Database Access Policy and Demo

## Remote access policy

Production policy for PostgreSQL:

- Do not expose database to public internet.
- Bind DB host port to loopback by default:
  - `DB_BIND_ADDRESS=127.0.0.1`
- Use one of the approved access patterns:
  - SSH tunnel from operator workstation
  - VPN/private network
  - Bastion host with MFA

This repository defaults to loopback binding in compose files, so external direct access is blocked unless explicitly overridden.

## Secure remote access via SSH tunnel

From your local machine:

```bash
ssh -L 5432:127.0.0.1:5432 todadmin@<vm_public_ip>
```

Then connect your SQL client to `localhost:5432`.

## Migration and seed demo script

1) Start stack:

```bash
docker compose up -d --build
```

2) Confirm DB healthy:

```bash
docker compose ps postgres
```

3) Apply migrations in backend container:

```bash
docker compose exec backend npm run migration:run
```

4) Validate seeded schema/table presence:

```bash
docker compose exec postgres psql -U ${DB_USERNAME:-postgres} -d ${DB_NAME:-tod} -c "\dt"
```

5) Verify application DB authorization path:

```bash
curl http://localhost:${BACKEND_PORT:-3001}/health
```

If health endpoint is `200`, backend-to-DB credentials are valid.
