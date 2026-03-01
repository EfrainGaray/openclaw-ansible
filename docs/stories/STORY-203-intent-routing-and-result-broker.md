# STORY-203 - Intent routing and broker attribution

Status: Done

## Acceptance Criteria

- Router classifies intent and sends to target subject.
- Worker output includes `fromAgent`, `taskId`, and confirmation flag.
- Broker persists task result and sends Telegram reply with attribution.

## Evidence

- `control-plane/src/router/router.runner.ts`
- `control-plane/src/worker/worker.runner.ts`
- `control-plane/src/broker/broker.runner.ts`
- `control-plane/src/common/contracts.ts`
