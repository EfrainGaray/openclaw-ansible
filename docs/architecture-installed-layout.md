---
title: Installed Runtime Layout (dev-main + efra-core)
summary: Detailed installed system structure, runtime topology, and permissions for OpenClaw enterprise profile dev-main and control-plane profile efra-core.
---

# Installed Runtime Layout (dev-main + efra-core)

This document describes how Ansible leaves the system installed for:

- Gateway enterprise profile: `dev-main`
- Control-plane profile (full mode): `efra-core`

## 1) Disk Layout + Permissions (Detailed)

```mermaid
flowchart LR
  subgraph SRC["Ansible source (/home/efra/openclaw-ansible)"]
    INV["inventories/dev/group_vars/all.yml"]
    ER["role: openclaw_enterprise"]
    CR["role: openclaw_control_plane"]
    AS["ops/auth-sync.sh (make auth-sync)"]
  end

  subgraph ETC["System artifacts (/etc + systemd)"]
    EROOT["/etc/openclaw\\n750 root:openclaw"]
    ESEC["/etc/openclaw/secrets\\n750 root:openclaw"]
    EDEV["/etc/openclaw/secrets/dev-main.env\\n640 root:openclaw"]
    EAND["/etc/openclaw/secrets/andrea.env\\n640 root:openclaw"]
    UDEV["/etc/systemd/system/openclaw-gateway-dev-main.service\\n644 root:root"]
    UAND["/etc/systemd/system/openclaw-gateway-andrea.service\\n644 root:root"]
  end

  subgraph GW["Gateway profile dev-main (/home/openclaw/.openclaw-dev-main)"]
    GROOT["state dir\\n755 openclaw:openclaw"]
    GCFG["openclaw.json\\n600 openclaw:openclaw"]
    GAG["agents/\\n755 openclaw:openclaw"]

    AMAIN["agents/main/agent\\n700 openclaw:openclaw"]
    ARES["agents/research/agent\\n700 openclaw:openclaw"]
    ABRO["agents/browser-login/agent\\n700 openclaw:openclaw"]
    ACOO["agents/coolify-ops/agent\\n700 openclaw:openclaw"]

    PMAIN["auth-profiles.json (main)\\n600 openclaw:openclaw"]
    PRES["auth-profiles.json (research)\\n600 openclaw:openclaw"]
    PBRO["auth-profiles.json (browser-login)\\n600 openclaw:openclaw"]
    PCOO["auth-profiles.json (coolify-ops)\\n600 openclaw:openclaw"]

    WMAIN["workspace\\n755 openclaw:openclaw"]
    WRES["workspace-research\\n755 openclaw:clock"]
    WBRO["workspace-browser-login\\n755 openclaw:openclaw"]
    WCOO["workspace-coolify-ops\\n755 openclaw:clock"]

    SMAIN["agents/main/sessions\\n755 openclaw:openclaw"]
    GWPROC["systemd: openclaw-gateway-dev-main\\nUser=openclaw Group=openclaw\\nbind 127.0.0.1:19011"]
  end

  subgraph COD["Codex creds path"]
    ECOD["/home/efra/.codex\\n(source creds)"]
    OCOD["/home/openclaw/.codex\\n700 openclaw:openclaw"]
    OAUTH1["/home/openclaw/.codex/auth.json\\n600 openclaw:openclaw"]
    OAUTH2["/home/openclaw/.codex/auth-andrea.json\\n600 openclaw:openclaw"]
  end

  subgraph CPSRC["Control-plane build source"]
    CPROOT["/opt/openclaw/control-plane/source\\n755 efra:efra"]
  end

  subgraph CP["Control-plane profile efra-core (/home/efra/openclaw-control-plane/efra-core)"]
    CPDIR["project dir\\n755 efra:efra"]
    CPENV[".env\\n640 efra:efra"]
    CPC["docker-compose.yml\\n644 efra:efra"]
    CPP["prometheus/prometheus.yml\\n644 efra:efra"]
    CPG["grafana/provisioning/datasources/datasource.yml\\n644 efra:efra"]

    DROOT["data/\\n755 efra:efra"]
    DNATS["data/nats\\n755 root:root"]
    DPG["data/postgres\\n700 uid70:root"]
    DPROM["data/prometheus\\n755 root:root"]
    DGRA["data/grafana\\n755 root:root"]
    DUK["data/uptime-kuma\\n755 root:root"]
  end

  subgraph RT["Docker runtime (project ocp-efra-core)"]
    ING["ingress\\n127.0.0.1:30101->3000"]
    API["control-api\\n127.0.0.1:39101->39090"]
    NATS["nats\\n127.0.0.1:14222->4222"]
    PG["postgres"]
    ROU["router"]
    BRK["broker"]
    WM["worker-main"]
    WR["worker-research"]
    WBL["worker-browser-login\\n(host network + shm 1gb)"]
    WCO["worker-coolify-ops"]
    PRO["prometheus\\n127.0.0.1:39091->9090"]
    GRA["grafana\\n127.0.0.1:31001->3000"]
    UK["uptime-kuma\\n127.0.0.1:31081->3001"]
  end

  INV --> ER
  INV --> CR
  INV --> AS

  ER --> EROOT
  ER --> ESEC
  ER --> EDEV
  ER --> UDEV
  ER --> GROOT
  ER --> GCFG
  UDEV --> GWPROC
  ESEC --> EDEV
  ESEC --> EAND
  GROOT --> GAG
  GAG --> AMAIN --> PMAIN
  GAG --> ARES --> PRES
  GAG --> ABRO --> PBRO
  GAG --> ACOO --> PCOO
  GROOT --> WMAIN
  GROOT --> WRES
  GROOT --> WBRO
  GROOT --> WCOO
  GAG --> SMAIN
  GCFG --> GWPROC

  ECOD --> AS --> OCOD
  AS --> OAUTH1
  AS --> OAUTH2
  AS --> PMAIN
  AS --> PRES
  AS --> PBRO
  AS --> PCOO
  AS --> GCFG

  CR --> CPROOT
  CR --> CPDIR
  CR --> CPENV
  CR --> CPC
  CR --> CPP
  CR --> CPG
  CR --> DROOT
  DROOT --> DNATS
  DROOT --> DPG
  DROOT --> DPROM
  DROOT --> DGRA
  DROOT --> DUK

  CPC --> RT
  CPENV --> RT
  CPROOT --> RT

  RT --> ING
  RT --> API
  RT --> NATS
  RT --> PG
  RT --> ROU
  RT --> BRK
  RT --> WM
  RT --> WR
  RT --> WBL
  RT --> WCO
  RT --> PRO
  RT --> GRA
  RT --> UK

  WM --> GWPROC
  WR --> GWPROC
  WBL --> GWPROC
  WCO --> GWPROC
```

## 2) Runtime Message Flow (full efra-core)

```mermaid
sequenceDiagram
  autonumber
  participant TG as Telegram/API client
  participant ING as ingress :30101
  participant NATS as NATS JetStream :14222
  participant RT as router
  participant WK as worker-<agent>
  participant OC as openclaw CLI (worker exec mode=openclaw)
  participant GW as gateway dev-main :19011
  participant BR as broker
  participant PG as Postgres
  participant CA as control-api :39101

  TG->>ING: POST /telegram/webhook or /ingress/simulate
  ING->>NATS: publish tasks.ingress
  RT->>NATS: consume tasks.ingress
  RT->>NATS: publish tasks.agent.<targetAgent>
  WK->>NATS: consume tasks.agent.<targetAgent>
  WK->>OC: openclaw --profile dev-main agent --agent <targetAgent>
  OC->>GW: uses /etc/openclaw/secrets/dev-main.env
  GW-->>OC: agent response
  WK->>NATS: publish results.agent.<targetAgent>
  BR->>NATS: consume results.agent.*
  BR->>PG: upsert task + events
  CA->>PG: GET /tasks/<taskId>
  BR-->>TG: optional Telegram sendMessage
```

## 3) Auth Sync Flow (non-interactive)

```mermaid
flowchart TB
  A["/home/efra/.codex/auth.json (+ auth-andrea.json)\\ncredential source"] --> B["make auth-sync\\nops/auth-sync.sh"]
  B --> C["/home/openclaw/.codex\\n700 openclaw:openclaw"]
  C --> D["auth.json / auth-andrea.json\\n600 openclaw:openclaw"]

  B --> E["/home/openclaw/.openclaw-dev-main/agents/main/agent/auth-profiles.json\\n600 openclaw:openclaw"]
  B --> F[".../agents/research/agent/auth-profiles.json\\n600 openclaw:openclaw"]
  B --> G[".../agents/browser-login/agent/auth-profiles.json\\n600 openclaw:openclaw"]
  B --> H[".../agents/coolify-ops/agent/auth-profiles.json\\n600 openclaw:openclaw"]

  B --> I["openclaw.json (dev-main)\\nset model: openai-codex/gpt-5.3-codex"]
```

## 4) Quick Permission Matrix (critical paths)

| Path | Mode | Owner:Group | Purpose |
|---|---:|---|---|
| `/etc/openclaw` | `750` | `root:openclaw` | OpenClaw system config root |
| `/etc/openclaw/secrets` | `750` | `root:openclaw` | per-profile env secrets |
| `/etc/openclaw/secrets/dev-main.env` | `640` | `root:openclaw` | gateway/profile runtime secrets |
| `/etc/systemd/system/openclaw-gateway-dev-main.service` | `644` | `root:root` | gateway unit |
| `/home/openclaw/.openclaw-dev-main` | `755` | `openclaw:openclaw` | profile state root |
| `/home/openclaw/.openclaw-dev-main/openclaw.json` | `600` | `openclaw:openclaw` | profile config |
| `/home/openclaw/.openclaw-dev-main/agents/*/agent` | `700` | `openclaw:openclaw` | per-agent private state |
| `/home/openclaw/.openclaw-dev-main/agents/*/agent/auth-profiles.json` | `600` | `openclaw:openclaw` | provider auth store |
| `/home/openclaw/.codex` | `700` | `openclaw:openclaw` | local codex credential mirror |
| `/home/openclaw/.codex/auth*.json` | `600` | `openclaw:openclaw` | codex oauth tokens |
| `/home/efra/openclaw-control-plane/efra-core/.env` | `640` | `efra:efra` | compose secrets/env |
| `/home/efra/openclaw-control-plane/efra-core/data/postgres` | `700` | `uid70:root` | postgres persistent volume |
| `/opt/openclaw/control-plane/source` | `755` | `efra:efra` | service build source synced by ansible |

