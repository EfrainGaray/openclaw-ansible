# STORY-205 - Cloudflare subdomain exposure

Status: Done

## Acceptance Criteria

- Cloudflare Tunnel can be managed from Ansible as an optional role.
- Ingress routes map subdomains to loopback services (ingress/control-api/grafana/etc.).
- Operators can run a dedicated Cloudflare reconcile command without re-deploying all stacks.

## Evidence

- `roles/openclaw_cloudflare_tunnel/defaults/main.yml`
- `roles/openclaw_cloudflare_tunnel/tasks/main.yml`
- `roles/openclaw_cloudflare_tunnel/templates/cloudflared-config.yml.j2`
- `roles/openclaw_cloudflare_tunnel/templates/cloudflared.service.j2`
- `playbooks/cloudflare-only.yml`
- `ops/cloudflare-reconcile.sh`
- `Makefile`
- `docs/cloudflare-tunnel.md`
