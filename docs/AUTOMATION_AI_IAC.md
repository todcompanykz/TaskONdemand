# Automation, AI, and IaC

## n8n automation
- Compose overlay: `infra/docker/docker-compose.automation.yml`
- Workflows (import in n8n UI from **Workflows → Import**, or mount `/workflows` as in compose):
  - `infra/n8n/workflows/infra-alert-to-telegram.json` — webhook path `infra-alert`; formats **Alertmanager** payloads and plain `message` fields.
  - `infra/n8n/workflows/ai-assistant-query.json` — webhook path `ai-assistant`; returns normalized answer + trace metadata
- Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in the environment for the n8n container (see `docker-compose.automation.yml`).

## Alertmanager → Telegram (via n8n)
- Prometheus sends firing alerts to Alertmanager (`infra/monitoring/alertmanager.yml`).
- The default receiver posts to `http://n8n:5678/n8n/webhook/infra-alert` on the Docker network (matches `N8N_PATH=/n8n/`).
- Run the **automation** profile whenever you enable this receiver, or change the webhook URL in `alertmanager.yml`.

## Standalone Telegram script
- `scripts/telegram_notify.sh` — sends a message with `curl` to the Telegram Bot API (useful for CI or manual checks without n8n).

## AI integration
- n8n reads `AI_API_KEY`, `AI_API_BASE_URL`, and `AI_MODEL` from environment variables.
- By default the automation profile includes `opal` service (`litellm`) as OpenAI-compatible AI gateway.
- n8n default base URL is `http://opal:4000/v1`, so the same workflow can switch between providers without workflow changes.
- Keep API key in local `.env` only; do not commit secrets.

### AI demo scenario (for defense)
1. Start automation profile:
   - `docker compose --env-file .env -f infra/docker/docker-compose.full.yml --profile automation up -d --build`
2. Import and activate `ai-assistant-query.json` in n8n.
3. Send request:
   - `curl -X POST http://localhost/n8n/webhook/ai-assistant -H "Content-Type: application/json" -d "{\"prompt\":\"Summarize current infra health checks\"}"`
4. Expected response contains:
   - `answer` (assistant text)
   - `model`
   - `usage`
   - `trace.provider_base_url` and `trace.requested_at`

## Terraform
- Directory: `infra/iac/terraform`
- Hetzner-based reproducible VM provisioning — see `infra/iac/terraform/README.md`.
- Files: `main.tf`, `variables.tf`, `cloud-init.yaml.tftpl`, `terraform.tfvars.example`

## Ansible
- Inventory: `infra/iac/ansible/inventory/hosts.ini`
- Playbook: `infra/iac/ansible/playbooks/site.yml`
- Covers baseline packages, UFW rule setup, and firewall enablement.
