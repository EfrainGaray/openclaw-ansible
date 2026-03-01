# Inventories

Each environment has:

- `hosts.yml`
- `group_vars/all.yml`
- optional `group_vars/vault.yml` (encrypted with `ansible-vault`)
- `group_vars/vault.example.yml` template

`hosts.yml` can also include metadata-only node groups (for example `openclaw_mobile_nodes`)
to track Android/iOS companions that pair over Gateway WebSocket. Keep deployment targets
inside `openclaw_gateway`; mobile nodes are not SSH-managed by Ansible.

Resilience knobs (set in `group_vars/all.yml` or `-e`):

- `openclaw_rollout_serial` (default `1`)
- `openclaw_ignore_unreachable` (default `true`)
- `openclaw_max_fail_percentage` (default `100`)

Stage 2 control-plane knobs:

- `openclaw_control_plane_enabled`
- `openclaw_control_plane_manage_stack`
- `openclaw_control_plane_profiles` (`mode: full|lite`)

Example:

```bash
ansible-vault create inventories/prod/group_vars/vault.yml
```

Or bootstrap from template:

```bash
cp inventories/prod/group_vars/vault.example.yml inventories/prod/group_vars/vault.yml
ansible-vault encrypt inventories/prod/group_vars/vault.yml
```

`vault.yml` should define secrets referenced in `group_vars/all.yml`, for example:

```yaml
vault_openclaw_gateway_token_prod_main: "..."
vault_openclaw_gateway_token_prod_rescue: "..."
vault_openai_api_key_prod: "..."
vault_anthropic_api_key_prod: "..."
```

`vault_openai_api_key_*` / `vault_anthropic_api_key_*` can be left empty when using OAuth/browser login flows.

## Android node flow (metadata + operations)

1. Keep Android inventory entries under `openclaw_mobile_nodes` (metadata only).
   - Suggested metadata: `openclaw_node_tailnet_ip`, `openclaw_node_magicdns`, `openclaw_node_gateway`.
   - Discover from control host: `sudo tailscale status --json`.
2. Deploy/upgrade gateways with:
   - `ansible-playbook -i inventories/dev/hosts.yml playbooks/enterprise.yml --ask-become-pass`
3. Pair Android from a gateway host:
   - `openclaw nodes pending`
   - `openclaw nodes approve <requestId>`
4. Verify runtime connectivity:
   - `openclaw nodes status`

## Browser login agent flow

Enterprise profile examples include `browser-login` with browser-only access:

- `tools.profile: full`
- `tools.allow: ["browser"]`
- `sandbox.mode: "off"`
- `browser.defaultProfile: openclaw`

Manual login runbook on gateway host:

- `openclaw browser --browser-profile openclaw start`
- `openclaw browser --browser-profile openclaw open https://x.com`
