# STORY-204 - Observability and control API

Status: Done

## Acceptance Criteria

- Full mode exports metrics for Prometheus.
- Grafana is provisioned with default datasource.
- Control API provides task listing, details, decisions, and queue stats.

## Evidence

- `roles/openclaw_control_plane/templates/prometheus.yml.j2`
- `roles/openclaw_control_plane/templates/grafana-datasources.yml.j2`
- `control-plane/src/control-api/control.controller.ts`
- `control-plane/src/control-api/control.service.ts`
