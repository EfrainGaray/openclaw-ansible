#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ops/common.sh
source "${SCRIPT_DIR}/common.sh"

need_cmd awk
need_cmd sed
need_cmd tr

inventory_file="$(resolve_inventory)"
inventory_dir="$(cd "$(dirname "${inventory_file}")" && pwd)"
vault_file="${VAULT_FILE:-${inventory_dir}/group_vars/vault.yml}"
manual_file="${inventory_dir}/group_vars/vault.manual.refactor.yml"

extract_env_value() {
  local file="$1"
  local key="$2"
  if run_sudo test -f "${file}"; then
    run_sudo awk -F= -v key="$key" '$1 == key {print $2; exit}' "${file}" | tr -d '\r' || true
  fi
}

current_or_default() {
  local key="$1"
  local fallback="$2"
  if [[ -f "${vault_file}" ]]; then
    local current
    current="$(awk -F': *' -v key="$key" '$1 == key {sub(/^["'"'"']/, "", $2); sub(/["'"'"']$/, "", $2); print $2; exit}' "${vault_file}")"
    if [[ -n "${current}" ]]; then
      printf '%s' "${current}"
      return 0
    fi
  fi
  printf '%s' "${fallback}"
}

dev_main_gateway_token="$(extract_env_value /etc/openclaw/secrets/dev-main.env OPENCLAW_GATEWAY_TOKEN)"
andrea_gateway_token="$(extract_env_value /etc/openclaw/secrets/andrea.env OPENCLAW_GATEWAY_TOKEN)"

efra_cp_postgres="$(extract_env_value /home/efra/openclaw-control-plane/efra-core/.env POSTGRES_PASSWORD)"
efra_cp_nats="$(extract_env_value /home/efra/openclaw-control-plane/efra-core/.env NATS_PASSWORD)"
efra_tg_token="$(extract_env_value /home/efra/openclaw-control-plane/efra-core/.env TELEGRAM_BOT_TOKEN)"
efra_tg_chat="$(extract_env_value /home/efra/openclaw-control-plane/efra-core/.env TELEGRAM_DEFAULT_CHAT_ID)"

andrea_cp_postgres="$(extract_env_value /home/efra/openclaw-control-plane/andrea/.env POSTGRES_PASSWORD)"
andrea_cp_nats="$(extract_env_value /home/efra/openclaw-control-plane/andrea/.env NATS_PASSWORD)"
andrea_tg_token="$(extract_env_value /home/efra/openclaw-control-plane/andrea/.env TELEGRAM_BOT_TOKEN)"
andrea_tg_chat="$(extract_env_value /home/efra/openclaw-control-plane/andrea/.env TELEGRAM_DEFAULT_CHAT_ID)"

mkdir -p "${inventory_dir}/group_vars"
umask 077
cat > "${manual_file}" <<EOF
---
# Manual secrets refactor output. Review values, then merge into vault.yml and encrypt.
vault_openclaw_gateway_token_dev_main: "$(current_or_default vault_openclaw_gateway_token_dev_main "${dev_main_gateway_token:-replace-with-temp-token-dev-main}")"
vault_openclaw_gateway_token_andrea: "$(current_or_default vault_openclaw_gateway_token_andrea "${andrea_gateway_token:-replace-with-temp-token-andrea}")"
vault_openai_api_key_dev: "$(current_or_default vault_openai_api_key_dev "replace-with-temp-openai-key-dev")"
vault_anthropic_api_key_dev: "$(current_or_default vault_anthropic_api_key_dev "replace-with-temp-anthropic-key-dev")"
vault_openclaw_cp_postgres_password_efra_core: "$(current_or_default vault_openclaw_cp_postgres_password_efra_core "${efra_cp_postgres:-replace-with-strong-password}")"
vault_openclaw_cp_nats_password_efra_core: "$(current_or_default vault_openclaw_cp_nats_password_efra_core "${efra_cp_nats:-replace-with-strong-password}")"
vault_telegram_bot_token_efra_core: "$(current_or_default vault_telegram_bot_token_efra_core "${efra_tg_token:-replace-with-bot-token}")"
vault_telegram_default_chat_id_efra_core: "$(current_or_default vault_telegram_default_chat_id_efra_core "${efra_tg_chat:-replace-with-chat-id}")"
vault_openclaw_cp_postgres_password_andrea: "$(current_or_default vault_openclaw_cp_postgres_password_andrea "${andrea_cp_postgres:-replace-with-strong-password}")"
vault_openclaw_cp_nats_password_andrea: "$(current_or_default vault_openclaw_cp_nats_password_andrea "${andrea_cp_nats:-replace-with-strong-password}")"
vault_telegram_bot_token_andrea: "$(current_or_default vault_telegram_bot_token_andrea "${andrea_tg_token:-replace-with-bot-token}")"
vault_telegram_default_chat_id_andrea: "$(current_or_default vault_telegram_default_chat_id_andrea "${andrea_tg_chat:-replace-with-chat-id}")"
EOF

chmod 600 "${manual_file}"

log "Manual secrets refactor file generated: ${manual_file}"
log "Next steps:"
log "  1) Review and edit ${manual_file}"
log "  2) Merge keys into ${vault_file}"
log "  3) Encrypt vault file if needed: ansible-vault encrypt ${vault_file}"
log "  4) Validate: ./ops/validate-secrets.sh"
