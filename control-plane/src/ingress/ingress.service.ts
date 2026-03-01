import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NatsConnection } from 'nats';

import { type AppConfig, loadConfig } from '../common/config';
import { type TaskEnvelope } from '../common/contracts';
import { connectNats, encodeJson, ensureStream } from '../common/nats';

interface TelegramUpdate {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { id?: number | string; username?: string };
  };
}

@Injectable()
export class IngressService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngressService.name);
  private readonly cfg: AppConfig = loadConfig('ingress');
  private nc: NatsConnection | null = null;

  async onModuleInit(): Promise<void> {
    this.nc = await connectNats(this.cfg.natsUrl);
    await ensureStream(this.nc, this.cfg.natsStream);
    this.logger.log(`Connected to NATS at ${this.cfg.natsUrl}`);
  }

  async onModuleDestroy(): Promise<void> {
    await this.nc?.drain();
  }

  async ingestTelegram(body: TelegramUpdate): Promise<{ taskId: string }> {
    if (!this.nc) {
      throw new Error('NATS is not ready');
    }

    const text = body.message?.text?.trim() ?? '';
    const chatId = body.message?.chat?.id ? String(body.message.chat.id) : this.cfg.telegramDefaultChatId;
    const userId = body.message?.from?.id ? String(body.message.from.id) : undefined;
    const username = body.message?.from?.username;

    if (!text) {
      throw new Error('Message text is required');
    }

    const task: TaskEnvelope = {
      taskId: randomUUID(),
      profile: this.cfg.profile,
      source: {
        channel: 'telegram',
        chatId,
        userId,
        username
      },
      text,
      status: 'NEW',
      priority: 5,
      budgetTokens: 4000,
      createdAt: new Date().toISOString()
    };

    this.nc.publish('tasks.ingress', encodeJson(task));
    this.logger.log(`Queued task ${task.taskId} for ingress`);

    return { taskId: task.taskId };
  }
}
