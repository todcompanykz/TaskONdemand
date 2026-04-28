# Monitoring and Alert Runbook

## Architecture

1. Prometheus evaluates rules from `infra/monitoring/alerts.yml`.
2. Firing alerts are sent to Alertmanager (`infra/monitoring/alertmanager.yml`).
3. Alertmanager posts to n8n webhook: `http://n8n:5678/n8n/webhook/infra-alert`.
4. n8n workflow `infra-alert-to-telegram.json` sends message to Telegram Bot API.

## Prerequisites

- Full stack with monitoring + automation profiles is running:
  - `docker compose --env-file .env -f infra/docker/docker-compose.full.yml --profile monitoring --profile automation up -d --build`
- n8n workflow `Infra Alert to Telegram` is imported and active.
- `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set for n8n service.

## Fast health checks

```bash
docker compose -f infra/docker/docker-compose.full.yml ps
curl http://localhost:9090/-/ready
curl http://localhost:9093/-/ready
curl http://localhost/n8n/healthz
```

## E2E alert demo (recommended for defense)

### Scenario A: real infrastructure alert (`BackendDown`)

1) Stop backend container:

```bash
docker stop tod-backend
```

2) Wait ~60-90 seconds (rule has `for: 1m`).

3) Verify alert in Prometheus and Alertmanager:

```bash
curl "http://localhost:9090/api/v1/alerts"
curl "http://localhost:9093/api/v2/alerts"
```

4) Confirm Telegram message received.

5) Recover backend:

```bash
docker start tod-backend
```

### Scenario B: synthetic webhook test

```bash
curl -X POST http://localhost/n8n/webhook/infra-alert \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"Manual monitoring pipeline test from runbook\"}"
```

Expected: Telegram message arrives within a few seconds.

## Triage checklist

1. Is Prometheus target down?
   - `http://localhost:9090/targets`
2. Is Alertmanager receiving alerts?
   - `http://localhost:9093/#/alerts`
3. Is n8n webhook reachable?
   - `curl -i http://localhost/n8n/webhook/infra-alert`
4. Are Telegram variables set in n8n container?
   - `docker exec tod-n8n env | grep TELEGRAM`

## Post-incident actions

- Capture timestamps and impacted services.
- Attach alert payload and Telegram evidence to defense pack.
- Add preventive action item (threshold tuning, capacity, retries).
