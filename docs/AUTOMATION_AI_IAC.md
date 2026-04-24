# Automation, AI, and IaC

## n8n automation
- Compose overlay: `infra/docker/docker-compose.automation.yml`
- Workflows:
  - `infra/n8n/workflows/infra-alert-to-telegram.json`
  - `infra/n8n/workflows/ai-assistant-query.json`

## AI integration
- n8n reads `AI_API_KEY` and `AI_API_BASE_URL` from environment variables.
- Keep API key in local `.env` only; do not commit secrets.

## Terraform
- Directory: `infra/iac/terraform`
- Starter files:
  - `main.tf`
  - `variables.tf`
- Current template is local VM oriented and ready to be replaced with provider resources.

## Ansible
- Inventory: `infra/iac/ansible/inventory/hosts.ini`
- Playbook: `infra/iac/ansible/playbooks/site.yml`
- Covers baseline packages, UFW rule setup, and firewall enablement.
