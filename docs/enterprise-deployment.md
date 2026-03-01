---
title: Enterprise Deployment
summary: Multi-environment, multi-profile OpenClaw deployment with Ansible
---

# Enterprise Deployment

This repository now includes an enterprise deployment path with:

- Multi-environment inventories: `dev`, `staging`, `prod`, `research`
- Multi-profile gateway services per host
- Multi-agent profile config generation
- Multi-provider, multi-model defaults (OpenAI + Anthropic)
- Secret isolation via per-profile `EnvironmentFile`
- Stage 2 control-plane package (`full`/`lite`) with NATS + NestJS routing

## Files

- Playbook: `playbooks/enterprise.yml`
- Role: `roles/openclaw_enterprise`
- Stage 2 role: `roles/openclaw_control_plane`
- Stage 2 services source: `control-plane/`
- Inventories: `inventories/<env>/...`

## Run

```bash
ansible-playbook -i inventories/dev/hosts.yml playbooks/enterprise.yml --ask-become-pass
ansible-playbook -i inventories/staging/hosts.yml playbooks/enterprise.yml --ask-become-pass
ansible-playbook -i inventories/prod/hosts.yml playbooks/enterprise.yml --ask-become-pass
ansible-playbook -i inventories/research/hosts.yml playbooks/enterprise.yml --ask-become-pass
```

Or use the helper script:

```bash
./run-enterprise-playbook.sh dev
./run-enterprise-playbook.sh staging
./run-enterprise-playbook.sh prod
./run-enterprise-playbook.sh research
```

### Resilient rollout behavior

`playbooks/enterprise.yml` is configured for resilient multi-node rollout:

- `serial: 1` (one node at a time)
- `ignore_unreachable: true` (continue when one node is down)
- `any_errors_fatal: false`
- `max_fail_percentage: 100` (do not abort the whole batch on partial failure)

You can override at runtime:

```bash
./run-enterprise-playbook.sh dev -e openclaw_rollout_serial=2
./run-enterprise-playbook.sh dev -e openclaw_ignore_unreachable=false
./run-enterprise-playbook.sh dev -e openclaw_max_fail_percentage=50
```

## Secrets

Store credentials in Ansible Vault and reference them from `inventories/*/group_vars/all.yml`:

- `vault_openclaw_gateway_token_*`
- `vault_openai_api_key_*` (optional when using OAuth/browser auth)
- `vault_anthropic_api_key_*` (optional when using OAuth/browser auth)

The role writes `/etc/openclaw/secrets/<profile>.env` with mode `0640`, owner `root`, group `openclaw`.

### Initialize vault files

Copy example files and encrypt:

```bash
cp inventories/dev/group_vars/vault.example.yml inventories/dev/group_vars/vault.yml
cp inventories/staging/group_vars/vault.example.yml inventories/staging/group_vars/vault.yml
cp inventories/prod/group_vars/vault.example.yml inventories/prod/group_vars/vault.yml
cp inventories/research/group_vars/vault.example.yml inventories/research/group_vars/vault.yml

ansible-vault encrypt inventories/dev/group_vars/vault.yml
ansible-vault encrypt inventories/staging/group_vars/vault.yml
ansible-vault encrypt inventories/prod/group_vars/vault.yml
ansible-vault encrypt inventories/research/group_vars/vault.yml
```

`vault.yml` files are git-ignored by default.

## Service model

Each profile produces:

- Config file: `<state_dir>/openclaw.json`
- Systemd unit: `openclaw-gateway-<profile>.service`
- Runtime isolation via per-profile `OPENCLAW_PROFILE`, `OPENCLAW_STATE_DIR`, `OPENCLAW_CONFIG_PATH`, `OPENCLAW_GATEWAY_PORT`

## Android nodes in multi-node topology

Android is a companion node (`role: node`) that connects to the gateway WebSocket and
must be paired on the gateway side. It does not run the gateway service and should not
be treated as an Ansible SSH target.

Recommended pattern:

- Keep Linux gateways in `openclaw_gateway`.
- Keep Android references in `openclaw_mobile_nodes` as inventory metadata.
- Operate pairing/state from a gateway host:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes status
```

For tailnet-only connectivity, bind gateway profiles to tailnet interfaces and use
gateway tailnet IP/MagicDNS from Android.

## Browser login agent (OpenClaw-managed browser)

Enterprise profiles can include a dedicated `browser-login` agent with:

- `tools.profile: full` + `tools.allow: ["browser"]` (browser-only surface)
- `sandbox.mode: "off"` for reliable host login flows on strict sites
- profile-level browser default set to `openclaw`

Operational flow (from gateway host):

```bash
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw open https://x.com
```

Then sign in manually in the managed browser profile. Do not share credentials with the model.

## Notes

- Existing `playbook.yml` is unchanged for one-command installs.
- Use `playbooks/enterprise.yml` for multi-node production topology.
- Stage 2 queue orchestration and telemetry details: `docs/control-plane-stage2.md`.
