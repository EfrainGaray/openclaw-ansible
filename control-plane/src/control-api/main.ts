import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { loadConfig } from '../common/config';
import { initMetrics, startMetricsServer } from '../common/metrics';
import { ControlModule } from './control.module';

async function bootstrap(): Promise<void> {
  const cfg = loadConfig('control_api');
  const logger = new Logger('ControlApiMain');

  const app = await NestFactory.create(ControlModule, { bufferLogs: true });
  const port = Number.parseInt(process.env.HTTP_PORT ?? '39090', 10);
  await app.listen(port, '0.0.0.0');

  const metrics = initMetrics('control_api');
  startMetricsServer(cfg.metricsPort, metrics.registry);

  logger.log(`Control API listening on :${port}`);
  logger.log(`Metrics listening on :${cfg.metricsPort}`);
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
