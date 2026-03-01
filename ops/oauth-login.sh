#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ops/common.sh
source "${SCRIPT_DIR}/common.sh"

log "make oauth-login now delegates to non-interactive credential sync (auth-sync)."
exec "${SCRIPT_DIR}/auth-sync.sh"
