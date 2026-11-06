import { Redis } from 'ioredis';
import { sseManager } from './sse-manager.js';
import {
  isSyncChangedEvent,
  setSyncNotificationPublisher,
  type SyncChangedEvent,
} from './sync-notification.js';

const CHANNEL = 'brain-assistant:sync:changed';
const PUBLISH_TIMEOUT_MS = 200;

export function startRedisSyncNotifications(url: string): void {
  const publisherClient = new Redis(url, {
    maxRetriesPerRequest: 1,
    connectTimeout: PUBLISH_TIMEOUT_MS,
  });
  const subscriber = new Redis(url, {
    connectTimeout: PUBLISH_TIMEOUT_MS,
  });

  publisherClient.on('error', logRedisError);
  subscriber.on('error', logRedisError);

  setSyncNotificationPublisher({
    publish(event: SyncChangedEvent): Promise<void> {
      return publishWithTimeout(publisherClient, event);
    },
  });

  subscriber.on('message', (channel: string, message: string) => {
    if (channel !== CHANNEL) {
      return;
    }
    try {
      const parsed: unknown = JSON.parse(message);
      if (!isSyncChangedEvent(parsed)) {
        return;
      }
      sseManager.notify(parsed.userId, parsed.revision);
    } catch (error) {
      console.error('sync notification subscriber dropped a message', error);
    }
  });

  void subscriber.subscribe(CHANNEL);
}

function logRedisError(error: Error): void {
  console.error('sync notification redis error', error.message);
}

async function publishWithTimeout(client: Redis, event: SyncChangedEvent): Promise<void> {
  let publishError: unknown;
  const work = client.publish(CHANNEL, JSON.stringify(event)).catch((error: unknown) => {
    publishError = error;
  });

  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error('sync notification publish timed out')),
      PUBLISH_TIMEOUT_MS,
    );
  });

  try {
    await Promise.race([work, timeout]);
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }

  if (publishError instanceof Error) {
    throw publishError;
  }
  if (publishError !== undefined) {
    throw new Error('sync notification publish failed');
  }
}
