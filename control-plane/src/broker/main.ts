import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

import { BrokerModule } from './broker.module';

async function bootstrap(): Promise<void> {
  await NestFactory.createApplicationContext(BrokerModule, { bufferLogs: true });
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
