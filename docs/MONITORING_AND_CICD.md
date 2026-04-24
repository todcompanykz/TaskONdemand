# Monitoring and CI/CD

## Monitoring stack
- Compose file: `infra/docker/docker-compose.monitoring.yml`
- Components:
  - Prometheus
  - Grafana
  - Node Exporter
  - cAdvisor

## Start monitoring
```bash
docker compose -f infra/docker/docker-compose.base.yml -f infra/docker/docker-compose.monitoring.yml --profile monitoring up -d
```

## Grafana provisioning
- Datasource: `infra/monitoring/grafana/provisioning/datasources/prometheus.yml`
- Dashboards provider: `infra/monitoring/grafana/provisioning/dashboards/dashboards.yml`
- Starter dashboard: `infra/monitoring/grafana/dashboards/overview.json`

## Alerting
- Prometheus rule file: `infra/monitoring/alerts.yml`
- Includes backend availability and high CPU warning examples.

## Jenkins
- Pipeline file: `infra/jenkins/Jenkinsfile`
- Stages: checkout, install, backend tests, docker build, smoke health check.
