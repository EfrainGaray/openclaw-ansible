import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { ConsumerMessages, NatsConnection } from 'nats';
import type { Pool } from 'pg';

import { loadConfig } from '../common/config';
import { type TaskResult } from '../common/contracts';
import { type ServiceMetrics, initMetrics, startMetricsServer } from '../common/metrics';
import { connectNats, decodeJson, ensureConsumer, ensureStream } from '../common/nats';
import { createPgPool, migrate } from '../common/postgres';

@Injectable()
export class BrokerRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BrokerRunner.name);
  private readonly cfg = loadConfig('broker');
  private nc: NatsConnection | null = null;
  private pg: Pool | null = null;
  private messages: ConsumerMessages | null = null;
  private metrics: ServiceMetrics | null = null;
  private metricsServer: ReturnType<typeof startMetricsServer> | null = null;

  async onModuleInit(): Promise<void> {
    this.metrics = initMetrics('broker');
    this.metricsServer = startMetricsServer(this.cfg.metricsPort, this.metrics.registry);

    this.pg = createPgPool(this.cfg.pgUrl);
    await migrate(this.pg);

    this.nc = await connectNats(this.cfg.natsUrl);
    await ensureStream(this.nc, this.cfg.natsStream);
    const consumer = await ensureConsumer(this.nc, this.cfg.natsStream, `${this.cfg.profile}-broker`, 'results.agent.*');
    this.messages = await consumer.consume();

    this.run().catch((error: unknown) => this.logger.error(`Broker loop failed: ${String(error)}`));

    this.logger.log('Broker started');
  }

  async onModuleDestroy(): Promise<void> {
    this.messages?.close();
    await this.nc?.drain();
    await this.pg?.end();
    this.metricsServer?.close();
  }

  private async run(): Promise<void> {
    if (!this.messages || !this.nc || !this.pg) {
      throw new Error('Broker is not initialized');
    }

    for await (const msg of this.messages) {
      try {
        const result = decodeJson<TaskResult>(msg.data);
        await this.persist(result);
        await this.maybeSendTelegram(result);

        this.metrics?.handledMessages.inc();
        msg.ack();
      } catch (error) {
        this.metrics?.failedMessages.inc();
        msg.nak();
        this.logger.error(`Broker failed to process result: ${String(error)}`);
      }
    }
  }

  private async persist(result: TaskResult): Promise<void> {
    if (!this.pg) {
      return;
    }

    await this.pg.query(
      `
      INSERT INTO tasks (
        task_id, profile, source_channel, chat_id, user_id, intent, target_agent,
        status, needs_confirmation, summary, result_payload, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NULL, $6, $7, $8, $9, $10::jsonb, NOW())
      ON CONFLICT (task_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        needs_confirmation = EXCLUDED.needs_confirmation,
        summary = EXCLUDED.summary,
        result_payload = EXCLUDED.result_payload,
        target_agent = EXCLUDED.target_agent,
        updated_at = NOW();
      `,
      [
        result.taskId,
        result.profile,
        result.source?.channel ?? 'telegram',
        result.source?.chatId ?? null,
        result.source?.userId ?? null,
        result.fromAgent,
        result.status,
        result.needsConfirmation,
        result.summary,
        JSON.stringify(result)
      ]
    );

    await this.pg.query(
      `
      INSERT INTO task_events (task_id, profile, event_type, from_agent, payload)
      VALUES ($1, $2, $3, $4, $5::jsonb)
      `,
      [result.taskId, result.profile, 'result', result.fromAgent, JSON.stringify(result)]
    );
  }

  private async maybeSendTelegram(result: TaskResult): Promise<void> {
    if (!this.cfg.telegramBotToken) {
      return;
    }

    const chatId = result.source?.chatId ?? this.cfg.telegramDefaultChatId;
    if (!chatId) {
      return;
    }

    const lines = [
      `[agent=${result.fromAgent}] [task=${result.taskId}]`,
      result.summary,
      result.fullResponse
    ];

    if (result.needsConfirmation) {
      lines.push(`Accion pendiente. Responde: confirmar ${result.taskId} o rechazar ${result.taskId}`);
    }

    const response = await fetch(
      `https://api.telegram.org/bot${this.cfg.telegramBotToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: lines.join('\n')
        })
      }
    );

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`Telegram send failed: ${response.status} ${body}`);
    }
  }
}
