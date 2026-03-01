import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';

import { loadConfig } from '../common/config';
import { initMetrics, startMetricsServer } from '../common/metrics';
import { IngressModule } from './ingress.module';

async function bootstrap(): Promise<void> {
  const cfg = loadConfig('ingress');
  const logger = new Logger('IngressMain');

  const app = await NestFactory.create(IngressModule, { bufferLogs: true });

  const port = Number.parseInt(process.env.HTTP_PORT ?? '3000', 10);
  await app.listen(port, '0.0.0.0');

  const metrics = initMetrics('ingress');
  startMetricsServer(cfg.metricsPort, metrics.registry);

  logger.log(`Ingress service listening on :${port}`);
  logger.log(`Metrics listening on :${cfg.metricsPort}`);
}

bootstrap().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
