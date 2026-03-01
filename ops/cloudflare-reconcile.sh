#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ops/common.sh
source "${SCRIPT_DIR}/common.sh"

ansible_bin="$(resolve_ansible_bin)"
inventory_file="$(resolve_inventory)"
limit_host="$(resolve_limit)"

need_cmd "${ansible_bin}"
[[ -f "${inventory_file}" ]] || die "Inventory not found: ${inventory_file}"

extra_args=()
if [[ -n "${ANSIBLE_EXTRA_ARGS:-}" ]]; then
  # shellcheck disable=SC2206
  extra_args=( ${ANSIBLE_EXTRA_ARGS} )
fi

log "Reconciling Cloudflare tunnel (inventory=${inventory_file}, limit=${limit_host})."
"${ansible_bin}" \
  -i "${inventory_file}" \
  "${ROOT_DIR}/playbooks/cloudflare-only.yml" \
  -l "${limit_host}" \
  --become \
  "${extra_args[@]}"

log "Cloudflare reconcile completed."
