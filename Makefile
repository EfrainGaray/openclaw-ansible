SHELL := /usr/bin/env bash

.DEFAULT_GOAL := help

ENV ?= dev
INVENTORY ?= inventories/$(ENV)/hosts.yml
LIMIT ?= zennook
PROFILES ?= dev-main andrea
OAUTH_PROVIDER ?= openai-codex
MODEL_REF ?= openai-codex/gpt-5.3-codex

.PHONY: help backup purge install cloudflare auth-sync oauth-login smoke reinstall secrets-refactor

help:
	@echo "OpenClaw Ops Targets"
	@echo ""
	@echo "  make backup                           Backup current OpenClaw + control-plane state"
	@echo "  make purge CONFIRM=1                 Purge deployed state and containers"
	@echo "  make install                          Install/reconcile enterprise + control-plane"
	@echo "  make secrets-refactor                Build manual secrets migration file + validate vault"
	@echo "  make cloudflare                       Reconcile Cloudflare tunnel/service only"
	@echo "  make auth-sync                        Sync Codex creds from /home/efra/.codex to OpenClaw profiles"
	@echo "  make oauth-login                      Alias to make auth-sync (legacy name)"
	@echo "  make smoke                            Run post-install smoke checks"
	@echo "  make reinstall CONFIRM=1              backup + purge + install + smoke"
	@echo ""
	@echo "Variables:"
	@echo "  ENV=$(ENV) INVENTORY=$(INVENTORY) LIMIT=$(LIMIT)"
	@echo "  PROFILES='$(PROFILES)' OAUTH_PROVIDER=$(OAUTH_PROVIDER) MODEL_REF=$(MODEL_REF)"

backup:
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" ./ops/backup.sh

purge:
	@if [[ "$(CONFIRM)" != "1" ]]; then echo "Use: make purge CONFIRM=1"; exit 1; fi
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" ./ops/purge.sh --yes

install:
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" ./ops/install.sh

secrets-refactor:
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" ./ops/secrets-refactor.sh

cloudflare:
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" ./ops/cloudflare-reconcile.sh

auth-sync:
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" PROFILES="$(PROFILES)" OAUTH_PROVIDER="$(OAUTH_PROVIDER)" MODEL_REF="$(MODEL_REF)" ./ops/auth-sync.sh

oauth-login: auth-sync

smoke:
	@ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)" ./ops/smoke.sh

reinstall:
	@if [[ "$(CONFIRM)" != "1" ]]; then echo "Use: make reinstall CONFIRM=1"; exit 1; fi
	@$(MAKE) backup ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)"
	@$(MAKE) purge CONFIRM=1 ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)"
	@$(MAKE) install ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)"
	@$(MAKE) smoke ENV="$(ENV)" INVENTORY="$(INVENTORY)" LIMIT="$(LIMIT)"
