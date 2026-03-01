import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { WorkerModule } from './worker.module';

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
