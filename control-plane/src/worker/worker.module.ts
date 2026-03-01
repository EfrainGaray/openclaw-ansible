import { Module } from '@nestjs/common';

import { WorkerRunner } from './worker.runner';

@Module({
  providers: [WorkerRunner]
})
export class WorkerModule {}
