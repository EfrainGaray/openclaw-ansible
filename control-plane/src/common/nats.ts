import { StringCodec, connect, type Consumer, type NatsConnection } from 'nats';

const sc = StringCodec();

export async function connectNats(servers: string): Promise<NatsConnection> {
  return connect({ servers: servers.split(',').map((v) => v.trim()) });
}

export async function ensureStream(nc: NatsConnection, streamName: string): Promise<void> {
  const jsm = await nc.jetstreamManager();

  try {
    await jsm.streams.info(streamName);
  } catch {
    await jsm.streams.add({
      name: streamName,
      subjects: ['tasks.>', 'results.>', 'control.>'],
      retention: 'limits',
      max_age: 7 * 24 * 60 * 60 * 1_000_000_000
    });
  }
}

export async function ensureConsumer(
  nc: NatsConnection,
  streamName: string,
  durableName: string,
  filterSubject: string
): Promise<Consumer> {
  const jsm = await nc.jetstreamManager();

  try {
    await jsm.consumers.info(streamName, durableName);
  } catch {
    await jsm.consumers.add(streamName, {
      durable_name: durableName,
      ack_policy: 'explicit',
      deliver_policy: 'all',
      filter_subject: filterSubject,
      max_ack_pending: 200,
      replay_policy: 'instant'
    });
  }

  const js = nc.jetstream();
  return js.consumers.get(streamName, durableName);
}

export function encodeJson(payload: unknown): Uint8Array {
  return sc.encode(JSON.stringify(payload));
}

export function decodeJson<T>(payload: Uint8Array): T {
  return JSON.parse(sc.decode(payload)) as T;
}
