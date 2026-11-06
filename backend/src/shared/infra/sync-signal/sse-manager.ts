import type { Response } from 'express';
import type { SyncAvailableContract } from '@brainassistant/contracts';

type SseClient = Pick<Response, 'write'>;

export class SseManager {
  private readonly connections = new Map<string, Set<SseClient>>();

  public add(userId: string, client: SseClient): void {
    const existing = this.connections.get(userId);
    if (existing) {
      existing.add(client);
      return;
    }
    this.connections.set(userId, new Set([client]));
  }

  public remove(userId: string, client: SseClient): void {
    const existing = this.connections.get(userId);
    if (!existing) {
      return;
    }
    existing.delete(client);
    if (existing.size === 0) {
      this.connections.delete(userId);
    }
  }

  public notify(userId: string, revision: number): void {
    const existing = this.connections.get(userId);
    if (!existing) {
      return;
    }
    const payload: SyncAvailableContract.Event = { version: revision };
    const body = `event: sync.available\ndata: ${JSON.stringify(payload)}\n\n`;
    for (const client of existing) {
      try {
        client.write(body);
      } catch {
        existing.delete(client);
      }
    }
    if (existing.size === 0) {
      this.connections.delete(userId);
    }
  }
}

export const sseManager = new SseManager();
