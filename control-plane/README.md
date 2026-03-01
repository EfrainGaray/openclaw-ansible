# OpenClaw Control Plane (Stage 2)

NestJS microservices + NATS JetStream control plane for multi-agent routing:

- `ingress`: receives Telegram/API payloads and emits `tasks.ingress`
- `router`: classifies intent and routes to `tasks.agent.<agent>`
- `worker`: executes per agent and emits `results.agent.<agent>`
- `broker`: persists results and optionally replies to Telegram
- `control-api`: task state, queue stats, confirm/reject actions

## Run locally

```bash
npm install
npm run build
npm run start:ingress
npm run start:router
npm run start:worker
npm run start:broker
npm run start:control-api
```

Environment variables:

- `OPENCLAW_PROFILE`
- `NATS_URL`
- `NATS_STREAM`
- `POSTGRES_URL`
- `TELEGRAM_BOT_TOKEN` (optional)
- `TELEGRAM_DEFAULT_CHAT_ID` (optional)
- `ROUTER_FORCED_AGENT` (optional)
- `WORKER_AGENT_ID` (for worker service)
