# STORY-202 - Deploy lite stack for andrea

Status: Done

## Acceptance Criteria

- Lite compose includes only minimal services.
- Router forced route to `main` worker.
- Independent profile variables and secrets.

## Evidence

- `roles/openclaw_control_plane/templates/docker-compose.lite.yml.j2`
- `inventories/dev/group_vars/all.yml` (`openclaw_control_plane_profiles[andrea]`)
