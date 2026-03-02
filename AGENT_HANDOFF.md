# Codex Agent Handoff

## Current State (2026-03-01)
- Enterprise install works end-to-end for `dev-main` + `andrea` profiles; control-plane Spins deployed via Docker Compose stacks under `/home/efra/openclaw-control-plane/` and managed via `make reinstall CONFIRM=1 ENV=dev LIMIT=zennook`.
- Postgres auth reconcilation now uses profile-specific admin credentials before flagging health check failures (`roles/openclaw_control_plane/tasks/profile.yml`).
- Smoke flow verifies queue + control API by checking `/tasks/{taskId}` until the task reaches a terminal status; `ops/smoke.sh` now retries and reports last status.
- OAuth login is manageable via `make oauth-login PROFILES="dev-main andrea" OAUTH_PROVIDER=openai-codex`, automatically sources `/etc/openclaw/secrets/<profile>.env`, and lists auth profiles when done (`ops/oauth-login.sh`).
- Secrets refactor pipeline adds `ops/secrets-refactor.sh`, `ops/validate-secrets.sh`, and the Makefile target `make secrets-refactor` (docs updated accordingly).

## Handoff Checklist
1. Confirm `/etc/openclaw/secrets/dev-main.env` and `/etc/openclaw/secrets/andrea.env` contain the required temp tokens; backups are stored under `backups/`.
2. Run `make reinstall CONFIRM=1 ENV=dev LIMIT=zennook` if the environment is dirty again; the playbooks already handle purge/install/smoke in one shot.
3. After OAuth login you still need to populate `auth-profiles.json` for each agent; run `openclaw --profile <profile> models auth list` to see active entries.
4. Verify Telegram tokens via `cat /etc/openclaw/secrets/dev-main.env` (mask the values in outputs). They are also referenced in `inventories/dev/group_vars/vault.yml` and each control-plane `.env` file.

## Next Steps for Codex agent
- Finish the implementation plan for Ansible multi-agent deployment (already captured elsewhere, but double-check architecture docs and inventory). Copy actionable instructions into the reserved roadmap file.
- When writing PRs, include `@codex` mention, request a full review, and ask for architecture implementation plan per earlier requirements.
- Keep `ops/oauth-login.sh` and `ops/smoke.sh` in sync with any profile additions (e.g., add new profile names to `PROFILES` in `Makefile`).

## Useful Commands
- `make secrets-refactor ENV=dev LIMIT=zennook`
- `make reinstall CONFIRM=1 ENV=dev LIMIT=zennook`
- `make oauth-login PROFILES="dev-main andrea" OAUTH_PROVIDER=openai-codex`
- `make smoke ENV=dev LIMIT=zennook`

Keep notes in this file before handing off to another Codex agent; update the `next steps` section if you take new actions.
