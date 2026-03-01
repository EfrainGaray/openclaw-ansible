#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ops/common.sh
source "${SCRIPT_DIR}/common.sh"

inventory_file="$(resolve_inventory)"
inventory_dir="$(cd "$(dirname "${inventory_file}")" && pwd)"
vault_file="${VAULT_FILE:-${inventory_dir}/group_vars/vault.yml}"

[[ -f "${vault_file}" ]] || die "Missing vault file: ${vault_file}"

read_yaml_value() {
  local key="$1"
  awk -F': *' -v key="$key" '$1 == key {sub(/^["'"'"']/, "", $2); sub(/["'"'"']$/, "", $2); print $2; exit}' "${vault_file}"
}

is_placeholder() {
  local v="${1:-}"
  [[ -z "${v}" ]] && return 0
  [[ "${v}" =~ replace-with|replace-me|changeme|example|dummy|temp-token|temp-key ]]
}

required_keys=(
  "vault_openclaw_gateway_token_dev_main"
  "vault_openclaw_gateway_token_andrea"
  "vault_openclaw_cp_postgres_password_efra_core"
  "vault_openclaw_cp_nats_password_efra_core"
  "vault_openclaw_cp_postgres_password_andrea"
  "vault_openclaw_cp_nats_password_andrea"
)

missing=()
for key in "${required_keys[@]}"; do
  value="$(read_yaml_value "${key}")"
  if is_placeholder "${value}"; then
    missing+=("${key}")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf '[ops] ERROR: vault secrets missing or placeholders detected:\n' >&2
  for key in "${missing[@]}"; do
    printf '  - %s\n' "${key}" >&2
  done
  printf '[ops] Run: make secrets-refactor\n' >&2
  exit 1
fi

log "Vault secret validation passed: ${vault_file}"
