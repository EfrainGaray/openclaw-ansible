# EPIC-002 - Stage 2 Queue Control Plane

Status: In Progress
Owner: platform/devops

## Goal

Deliver a reusable package that adds queue orchestration, routing-by-intent, and telemetry for OpenClaw multi-agent deployments.

## Scope

- NATS JetStream task bus
- NestJS microservices control plane
- `full` and `lite` deployment modes
- Inventory-driven packaging for reuse in other profiles

## Acceptance Criteria

1. `efra-core` profile deploys full stack from Ansible.
2. `andrea` profile deploys lite stack from Ansible.
3. Telegram ingress can route and persist tasks with source + agent attribution.
4. Control API exposes task list and queue stats.
5. Full mode exposes Prometheus/Grafana/Uptime Kuma.
6. Documentation includes install, operations, rollback, and secrets map.

## Evidence

- `playbooks/enterprise.yml` includes `openclaw_control_plane` role.
- `roles/openclaw_control_plane/*` templates and tasks render full/lite stacks.
- `control-plane/src/*` contains ingress/router/worker/broker/control-api.
- `inventories/dev/group_vars/all.yml` defines `efra-core` (full) and `andrea` (lite).
- `docs/control-plane-stage2.md` documents runbook.
