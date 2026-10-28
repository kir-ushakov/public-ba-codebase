import { AsyncLocalStorage } from 'node:async_hooks';
import { ServiceErrorLevel } from '../../core/service-error-level.enum.js';
import { serviceFail } from '../../core/service-fail.factory.js';
import { sseManager } from './sse-manager.js';
import { ESyncNotificationError } from './sync-notification.error.js';

export type SyncChangedEvent = {
  userId: string;
  revision: number;
};

export interface SyncNotificationPublisher {
  publish(event: SyncChangedEvent): Promise<void>;
}

type SyncScope = {
  pending: Map<string, number>;
};

const syncScope = new AsyncLocalStorage<SyncScope>();

const inProcessSyncNotificationPublisher: SyncNotificationPublisher = {
  publish(event: SyncChangedEvent): Promise<void> {
    sseManager.notify(event.userId, event.revision);
    return Promise.resolve();
  },
};

let publisher: SyncNotificationPublisher = inProcessSyncNotificationPublisher;

export function setSyncNotificationPublisher(next: SyncNotificationPublisher): void {
  publisher = next;
}

export function useInProcessSyncNotifications(): void {
  publisher = inProcessSyncNotificationPublisher;
}

export function isSyncChangedEvent(value: unknown): value is SyncChangedEvent {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('userId' in value) || !('revision' in value)) {
    return false;
  }
  return typeof value.userId === 'string' && typeof value.revision === 'number';
}

export function noteCommittedRevision(userId: string, revision: number): void {
  const ownerId = String(userId);
  const scope = syncScope.getStore();
  if (!scope) {
    void publishSafely({ userId: ownerId, revision });
    return;
  }
  const previous = scope.pending.get(ownerId) ?? 0;
  if (revision > previous) {
    scope.pending.set(ownerId, revision);
  }
}

export async function runWithSyncNotificationScope<T>(work: () => Promise<T>): Promise<T> {
  const scope: SyncScope = { pending: new Map() };
  try {
    return await syncScope.run(scope, work);
  } finally {
    await publishPending(scope);
  }
}

async function publishPending(scope: SyncScope): Promise<void> {
  const events = [...scope.pending.entries()].map(([userId, revision]) => ({ userId, revision }));
  await Promise.all(events.map(event => publishSafely(event)));
}

async function publishSafely(event: SyncChangedEvent): Promise<void> {
  try {
    await publisher.publish(event);
  } catch (error) {
    void serviceFail('sync notification was not published', ESyncNotificationError.PublishFailed, {
      level: ServiceErrorLevel.Medium,
      error,
      metadata: { userId: event.userId, revision: event.revision },
    });
  }
}
