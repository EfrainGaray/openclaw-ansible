export interface AppConfig {
  serviceName: string;
  profile: string;
  natsUrl: string;
  natsStream: string;
  metricsPort: number;
  pgUrl: string;
  telegramBotToken: string;
  telegramDefaultChatId: string;
  routerForcedAgent: string;
  workerAgentId: string;
}

function intFromEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function loadConfig(serviceName: string): AppConfig {
  return {
    serviceName,
    profile: process.env.OPENCLAW_PROFILE ?? 'efra-core',
    natsUrl: process.env.NATS_URL ?? 'nats://nats:4222',
    natsStream: process.env.NATS_STREAM ?? 'OPENCLAW_TASKS',
    metricsPort: intFromEnv('METRICS_PORT', 9400),
    pgUrl: process.env.POSTGRES_URL ?? 'postgres://openclaw:openclaw@postgres:5432/openclaw_control',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    telegramDefaultChatId: process.env.TELEGRAM_DEFAULT_CHAT_ID ?? '',
    routerForcedAgent: process.env.ROUTER_FORCED_AGENT ?? '',
    workerAgentId: process.env.WORKER_AGENT_ID ?? 'main'
  };
}
