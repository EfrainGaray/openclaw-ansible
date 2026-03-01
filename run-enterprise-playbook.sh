#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT=${1:-dev}
INVENTORY="inventories/${ENVIRONMENT}/hosts.yml"
PLAYBOOK="playbooks/enterprise.yml"
VAULT_VARS_FILE="inventories/${ENVIRONMENT}/group_vars/vault.yml"

if [[ ! -f "$INVENTORY" ]]; then
  echo "Inventory not found: $INVENTORY" >&2
  echo "Usage: $0 <dev|staging|prod|research> [ansible extra args...]" >&2
  exit 1
fi

shift || true

EXTRA_ARGS=("$@")

if [[ -f "$VAULT_VARS_FILE" ]]; then
  EXTRA_ARGS+=("-e" "@${VAULT_VARS_FILE}")
fi

ansible-playbook -i "$INVENTORY" "$PLAYBOOK" --ask-become-pass "${EXTRA_ARGS[@]}"
