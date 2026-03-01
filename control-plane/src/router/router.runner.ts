import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import type { ConsumerMessages, NatsConnection } from 'nats';

import { loadConfig } from '../common/config';
import { classifyIntent } from '../common/intents';
import { type ServiceMetrics, initMetrics, startMetricsServer } from '../common/metrics';
import { type TaskEnvelope } from '../common/contracts';
import { connectNats, decodeJson, encodeJson, ensureConsumer, ensureStream } from '../common/nats';

@Injectable()
export class RouterRunner implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RouterRunner.name);
  private readonly cfg = loadConfig('router');
  private nc: NatsConnection | null = null;
  private messages: ConsumerMessages | null = null;
  private metrics: ServiceMetrics | null = null;
  private metricsServer: ReturnType<typeof startMetricsServer> | null = null;

  async onModuleInit(): Promise<void> {
    this.metrics = initMetrics('router');
    this.metricsServer = startMetricsServer(this.cfg.metricsPort, this.metrics.registry);

    this.nc = await connectNats(this.cfg.natsUrl);
    await ensureStream(this.nc, this.cfg.natsStream);
    const consumer = await ensureConsumer(this.nc, this.cfg.natsStream, `${this.cfg.profile}-router`, 'tasks.ingress');
    this.messages = await consumer.consume();

    this.run().catch((error: unknown) => {
      this.logger.error(`Router loop failed: ${String(error)}`);
    });

    this.logger.log(`Router running for profile ${this.cfg.profile}`);
  }

  async onModuleDestroy(): Promise<void> {
    this.messages?.close();
    await this.nc?.drain();
    this.metricsServer?.close();
  }

  private async run(): Promise<void> {
    if (!this.messages || !this.nc) {
      throw new Error('Router is not initialized');
    }

    for await (const msg of this.messages) {
      try {
        const task = decodeJson<TaskEnvelope>(msg.data);
        const forced = this.cfg.routerForcedAgent.trim();
        const routed = forced
          ? { intent: `forced.${forced}`, targetAgent: forced }
          : classifyIntent(task.text);

        const enrichedTask: TaskEnvelope = {
          ...task,
          intent: routed.intent,
          targetAgent: routed.targetAgent,
          status: 'ROUTED'
        };

        this.nc.publish(`tasks.agent.${routed.targetAgent}`, encodeJson(enrichedTask));
        this.nc.publish('tasks.events', encodeJson({ type: 'task_routed', taskId: task.taskId, routed }));

        this.metrics?.handledMessages.inc();
        msg.ack();
      } catch (error) {
        this.metrics?.failedMessages.inc();
        msg.nak();
        this.logger.error(`Failed to route task: ${String(error)}`);
      }
    }
  }
}
