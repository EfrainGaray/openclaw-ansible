import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';

import { IngressService } from './ingress.service';

@Controller()
export class IngressController {
  constructor(private readonly ingressService: IngressService) {}

  @Get('/health')
  health(): { ok: true } {
    return { ok: true };
  }

  @Post('/telegram/webhook')
  @HttpCode(202)
  async telegramWebhook(@Body() body: unknown): Promise<{ accepted: true; taskId: string }> {
    const result = await this.ingressService.ingestTelegram(body as never);
    return { accepted: true, taskId: result.taskId };
  }

  @Post('/ingress/simulate')
  @HttpCode(202)
  async simulate(
    @Body() body: { text: string; chatId?: string; userId?: string; username?: string }
  ): Promise<{ accepted: true; taskId: string }> {
    const result = await this.ingressService.ingestTelegram({
      message: {
        text: body.text,
        chat: { id: body.chatId ?? 'local-sim' },
        from: { id: body.userId ?? 'local-user', username: body.username ?? 'simulator' }
      }
    });

    return { accepted: true, taskId: result.taskId };
  }
}
