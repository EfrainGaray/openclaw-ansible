import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { ConsumerMessages, NatsConnection } from 'nats';

import { loadConfig } from '../common/config';
import { type TaskEnvelope, type TaskResult } from '../common/contracts';
import { actionNeedsConfirmation } from '../common/intents';
import { type ServiceMetrics, initMetrics, startMetricsServer } from '../common/metrics';
import { connectNats, decodeJson, encodeJson, ensureConsumer, ensureStream } from '../common/nats';

@Injectable()
export class WorkerRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WorkerRunner.name);
  private readonly cfg = loadConfig('worker');
  private nc: NatsConnection | null = null;
  private messages: ConsumerMessages | null = null;
  private metrics: ServiceMetrics | null = null;
  private metricsServer: ReturnType<typeof startMetricsServer> | null = null;

  async onModuleInit(): Promise<void> {
    this.metrics = initMetrics(`worker_${this.cfg.workerAgentId.replace('-', '_')}`);
    this.metricsServer = startMetricsServer(this.cfg.metricsPort, this.metrics.registry);

    this.nc = await connectNats(this.cfg.natsUrl);
    await ensureStream(this.nc, this.cfg.natsStream);

    const durable = `${this.cfg.profile}-worker-${this.cfg.workerAgentId}`;
    const filter = `tasks.agent.${this.cfg.workerAgentId}`;
    const consumer = await ensureConsumer(this.nc, this.cfg.natsStream, durable, filter);
    this.messages = await consumer.consume();

    this.run().catch((error: unknown) => this.logger.error(`Worker loop failed: ${String(error)}`));

    this.logger.log(`Worker ${this.cfg.workerAgentId} online`);
  }

  async onModuleDestroy(): Promise<void> {
    this.messages?.close();
    await this.nc?.drain();
    this.metricsServer?.close();
  }

  private async run(): Promise<void> {
    if (!this.messages || !this.nc) {
      throw new Error('Worker is not initialized');
    }

    for await (const msg of this.messages) {
      try {
        const task = decodeJson<TaskEnvelope>(msg.data);
        const result = await this.processTask(task);
        this.nc.publish(`results.agent.${this.cfg.workerAgentId}`, encodeJson(result));
        this.metrics?.handledMessages.inc();
        msg.ack();
      } catch (error) {
        this.metrics?.failedMessages.inc();
        msg.nak();
        this.logger.error(`Failed task processing: ${String(error)}`);
      }
    }
  }

  private async processTask(task: TaskEnvelope): Promise<TaskResult> {
    const needsConfirmation = actionNeedsConfirmation(task.text);
    const summary = `Task ${task.taskId} routed to ${this.cfg.workerAgentId}`;

    const fullResponse = needsConfirmation
      ? `Action requires confirmation before execution: ${task.text}`
      : `Processed by ${this.cfg.workerAgentId}: ${task.text}`;

    const status: TaskResult['status'] = needsConfirmation ? 'WAITING_CONFIRMATION' : 'DONE';

    return {
      taskId: task.taskId,
      profile: task.profile,
      fromAgent: this.cfg.workerAgentId,
      status,
      summary,
      fullResponse,
      needsConfirmation,
      suggestedAction: needsConfirmation ? `confirmar ${task.taskId}` : undefined,
      tokenUsage: Math.min(300, task.text.length * 2),
      costEstimate: 0,
      source: task.source,
      createdAt: new Date().toISOString()
    };
  }
}
