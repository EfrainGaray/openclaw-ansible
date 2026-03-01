---
title: Operations Workflow (Backup, Purge, Install)
summary: Makefile-driven clean install/uninstall cycle for OpenClaw + Stage 2 control-plane
---

# Operations Workflow

This repository provides a Makefile interface over `ops/*.sh` scripts:

- `make backup`
- `make purge CONFIRM=1`
- `make install`
- `make secrets-refactor`
- `make cloudflare`
- `make auth-sync`
- `make smoke`
- `make reinstall CONFIRM=1`

## Why this split

- `Makefile`: stable operator commands.
- `ops/*.sh`: implementation details, safe to extend.

## Auth sync (Codex)

Credential sync is now non-interactive and uses Codex auth files from the `efra` user.

Use:

```bash
make auth-sync PROFILES="dev-main andrea" OAUTH_PROVIDER=openai-codex
# legacy alias (same behavior)
make oauth-login PROFILES="dev-main andrea" OAUTH_PROVIDER=openai-codex
```

Optional environment overrides (loaded from `/home/efra/.env` when present):

- `EFRA_CODEX_HOME` (default: `/home/efra/.codex`)
- `EFRA_CODEX_AUTH_DEFAULT` (default: `/home/efra/.codex/auth.json`)
- `EFRA_CODEX_AUTH_ANDREA` (default: `/home/efra/.codex/auth-andrea.json`)

The sync process:

- copies auth files to `/home/openclaw/.codex/`
- writes `openai-codex` OAuth profiles into each target profile's `auth-profiles.json`
- sets profile default model to `openai-codex/gpt-5.3-codex` (configurable with `MODEL_REF`)

Runtime command environment still auto-loads `/etc/openclaw/secrets/<profile>.env` and exports:

- `HOME=/home/openclaw`
- `OPENCLAW_BUNDLED_PLUGINS_DIR=/home/openclaw/.openclaw/bundled-extensions`

## Manual secrets refactor

Before a clean install, generate and review a manual migration file:

```bash
make secrets-refactor ENV=dev LIMIT=zennook
```

This creates:

- `inventories/dev/group_vars/vault.manual.refactor.yml`

Then:

```bash
# review and merge into vault.yml
./ops/validate-secrets.sh
```

`make install` now runs `./ops/validate-secrets.sh` first and aborts if required keys are
missing or still using placeholder values.

Cloudflare reconcile (subdomain exposure only):

```bash
make cloudflare ENV=dev LIMIT=zennook
```

## Defaults

- `ENV=dev`
- `INVENTORY=inventories/dev/hosts.yml`
- `LIMIT=zennook`
- `PROFILES="dev-main andrea"`

Override per command, for example:

```bash
make install ENV=staging LIMIT=fedora
```
