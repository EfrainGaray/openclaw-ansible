# STORY-201 - Deploy full stack for efra-core

Status: Done

## Acceptance Criteria

- Full compose includes NATS, Postgres, ingress, router, broker, 4 workers, control-api, Prometheus, Grafana, Uptime Kuma.
- Ports bind to loopback only.
- Secrets are read from per-profile variables.

## Evidence

- `roles/openclaw_control_plane/templates/docker-compose.full.yml.j2`
- `inventories/dev/group_vars/all.yml` (`openclaw_control_plane_profiles[efra-core]`)
