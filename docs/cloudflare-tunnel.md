---
title: Cloudflare Tunnel Exposure
summary: Publish OpenClaw and control-plane local services via Cloudflare subdomains
---

# Cloudflare Tunnel Exposure

This role ports the same model used in `/home/efra/develop/cloudflare-tunnel` into Ansible so
subdomain exposure can be reconciled together with enterprise deployment.

## What it manages

- Installs `cloudflared` (Debian/Ubuntu).
- Writes tunnel credentials and `config.yml`.
- Installs/starts a dedicated systemd service:
  - `cloudflared-<tunnel_name>.service`
- Optionally reconciles DNS CNAME records with:
  - `cloudflared tunnel route dns`

## Inventory variables

Set in `inventories/<env>/group_vars/all.yml`:

```yaml
openclaw_cloudflare_tunnel_enabled: true
openclaw_cloudflare_tunnel_name: "zennook-openclaw"
openclaw_cloudflare_tunnel_run_user: efra
openclaw_cloudflare_tunnel_run_group: efra
openclaw_cloudflare_tunnel_id: "{{ vault_cloudflare_tunnel_id }}"
openclaw_cloudflare_tunnel_credentials_json: "{{ vault_cloudflare_tunnel_credentials_json }}"
openclaw_cloudflare_tunnel_manage_dns: false
openclaw_cloudflare_tunnel_ingress:
  - hostname: "efra-core-ingress.example.com"
    service: "http://127.0.0.1:30101"
  - hostname: "efra-core-control.example.com"
    service: "http://127.0.0.1:39101"
```

Set secrets in `inventories/<env>/group_vars/vault.yml`:

```yaml
vault_cloudflare_tunnel_id: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
vault_cloudflare_tunnel_credentials_json: |
  {"AccountTag":"...","TunnelSecret":"...","TunnelID":"...","TunnelName":"..."}
```

## Run

```bash
# Full enterprise reconcile (includes cloudflare role when enabled)
make install ENV=dev LIMIT=zennook

# Cloudflare-only reconcile
make cloudflare ENV=dev LIMIT=zennook
```

## Notes

- The role assumes the tunnel already exists in Cloudflare.
- `openclaw_cloudflare_tunnel_manage_dns` is off by default to avoid accidental DNS writes.
- If DNS route reconcile is needed, first ensure `cloudflared tunnel login` was performed on the host.
