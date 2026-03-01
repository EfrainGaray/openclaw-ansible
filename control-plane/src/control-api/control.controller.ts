import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';

import { ControlService } from './control.service';

@Controller()
export class ControlController {
  constructor(private readonly controlService: ControlService) {}

  @Get('/health')
  health(): { ok: true } {
    return { ok: true };
  }

  @Get('/tasks')
  async tasks(@Query('limit', new ParseIntPipe({ optional: true })) limit?: number): Promise<unknown[]> {
    return this.controlService.listTasks(limit ?? 100);
  }

  @Get('/tasks/:taskId')
  async task(@Param('taskId') taskId: string): Promise<unknown> {
    return this.controlService.getTask(taskId);
  }

  @Post('/tasks/:taskId/confirm')
  async confirm(
    @Param('taskId') taskId: string,
    @Body() body: { actor?: string; note?: string }
  ): Promise<{ ok: true }> {
    await this.controlService.setDecision(taskId, 'confirm', body.actor ?? 'operator', body.note);
    return { ok: true };
  }

  @Post('/tasks/:taskId/reject')
  async reject(
    @Param('taskId') taskId: string,
    @Body() body: { actor?: string; note?: string }
  ): Promise<{ ok: true }> {
    await this.controlService.setDecision(taskId, 'reject', body.actor ?? 'operator', body.note);
    return { ok: true };
  }

  @Get('/queues')
  async queues(): Promise<unknown> {
    return this.controlService.queueStats();
  }
}
