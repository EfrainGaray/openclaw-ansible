import http from 'node:http';
import { Counter, Registry, collectDefaultMetrics } from 'prom-client';

export interface ServiceMetrics {
  registry: Registry;
  handledMessages: Counter<string>;
  failedMessages: Counter<string>;
}

export function initMetrics(service: string): ServiceMetrics {
  const registry = new Registry();
  collectDefaultMetrics({ register: registry, prefix: `${service}_` });

  const handledMessages = new Counter({
    name: `${service}_handled_messages_total`,
    help: `Handled messages by ${service}`,
    registers: [registry]
  });

  const failedMessages = new Counter({
    name: `${service}_failed_messages_total`,
    help: `Failed messages by ${service}`,
    registers: [registry]
  });

  return { registry, handledMessages, failedMessages };
}

export function startMetricsServer(port: number, registry: Registry): http.Server {
  const server = http.createServer(async (_req, res) => {
    if (_req.url === '/health') {
      res.statusCode = 200;
      res.end('ok');
      return;
    }

    if (_req.url === '/metrics') {
      res.setHeader('Content-Type', registry.contentType);
      res.end(await registry.metrics());
      return;
    }

    res.statusCode = 404;
    res.end('not found');
  });

  server.listen(port, '0.0.0.0');
  return server;
}
