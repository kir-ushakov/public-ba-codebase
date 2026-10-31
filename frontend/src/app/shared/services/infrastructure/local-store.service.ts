import { Injectable } from '@angular/core';
import { benchMark, benchMeasure } from '../../../benchmark/bench-marks';
import { EChangeAction, EChangedEntity } from '@brainassistant/contracts';
import { IDBPDatabase, IDBPTransaction, StoreNames } from 'idb';
import { Change } from '../../models/change.model';
import { OutboxEntry } from '../../models/outbox-entry.type';
import { Tag } from '../../models/tag.model';
import { Task } from '../../models/task.model';
import { AppDB, DatabaseService, DATABASE_CONFIG, SYNCED_REVISION_ID } from './database.service';

export type LocalSnapshot = {
  tasks: Task[];
  tags: Tag[];
  outbox: OutboxEntry[];
  syncedRevision: number;
};

type LocalTx = IDBPTransaction<AppDB, ArrayLike<StoreNames<AppDB>>, 'readwrite'>;

const SERVER_STORES = [
  DATABASE_CONFIG.STORES.TASKS,
  DATABASE_CONFIG.STORES.TAGS,
  DATABASE_CONFIG.STORES.OUTBOX,
  DATABASE_CONFIG.STORES.META,
] as const;

/**
 * Runs `work`, then commits. A throw aborts the transaction, so earlier puts in
 * `work` are not kept. IndexedDB would otherwise commit a transaction that had
 * already queued successful requests.
 */
export async function commitReadWrite<T>(
  db: IDBPDatabase<AppDB>,
  stores: StoreNames<AppDB>[],
  work: (tx: LocalTx) => Promise<T>,
): Promise<T> {
  const tx = db.transaction(stores, 'readwrite');
  try {
    const result = await work(tx);
    await tx.done;
    return result;
  } catch (error) {
    try {
      tx.abort();
    } catch {
      // A failed request aborts the transaction before we get here.
    }
    throw error;
  }
}

@Injectable({ providedIn: 'root' })
export class LocalStore {
  constructor(private readonly database: DatabaseService) {}

  public open(userId: string): Promise<void> {
    return this.database.open(userId);
  }

  public close(): Promise<void> {
    return this.database.close();
  }

  public async listOutbox(): Promise<OutboxEntry[]> {
    const db = await this.database.getDatabase();
    return db.getAll(DATABASE_CONFIG.STORES.OUTBOX);
  }

  public async loadAll(): Promise<LocalSnapshot> {
    benchMark('ba:idb-read:start');
    const db = await this.database.getDatabase();
    const tx = db.transaction(
      [
        DATABASE_CONFIG.STORES.TASKS,
        DATABASE_CONFIG.STORES.TAGS,
        DATABASE_CONFIG.STORES.OUTBOX,
        DATABASE_CONFIG.STORES.META,
      ],
      'readonly',
    );
    const tasks = await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).getAll();
    const tags = await tx.objectStore(DATABASE_CONFIG.STORES.TAGS).getAll();
    const outbox = await tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).getAll();
    const meta = await tx.objectStore(DATABASE_CONFIG.STORES.META).get(SYNCED_REVISION_ID);
    await tx.done;
    benchMark('ba:idb-read:end');
    benchMeasure('ba:idb-read', 'ba:idb-read:start', 'ba:idb-read:end');
    return {
      tasks,
      tags,
      outbox,
      syncedRevision: meta?.syncedRevision ?? 0,
    };
  }

  public async saveTaskAndEnqueue(task: Task, entry: OutboxEntry): Promise<void> {
    await this.database.open(task.userId);
    const db = await this.database.getDatabase();
    await commitReadWrite(
      db,
      [DATABASE_CONFIG.STORES.TASKS, DATABASE_CONFIG.STORES.OUTBOX],
      async tx => {
        await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).put(task);
        await tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).put(entry);
      },
    );
  }

  public async deleteTaskAndEnqueue(
    userId: string,
    taskId: string,
    entry: OutboxEntry,
  ): Promise<void> {
    await this.database.open(userId);
    const db = await this.database.getDatabase();
    await commitReadWrite(
      db,
      [DATABASE_CONFIG.STORES.TASKS, DATABASE_CONFIG.STORES.OUTBOX],
      async tx => {
        await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).delete(taskId);
        await tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).put(entry);
      },
    );
  }

  public async saveTagAndEnqueue(tag: Tag, entry: OutboxEntry): Promise<void> {
    await this.database.open(tag.userId);
    const db = await this.database.getDatabase();
    await commitReadWrite(
      db,
      [DATABASE_CONFIG.STORES.TAGS, DATABASE_CONFIG.STORES.OUTBOX],
      async tx => {
        await tx.objectStore(DATABASE_CONFIG.STORES.TAGS).put(tag);
        await tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).put(entry);
      },
    );
  }

  /**
   * Writes every server change that does not collide with a pending outbox row,
   * and the cursor, in one transaction. A pending local edit is left untouched.
   * The cursor still advances: the later push of that edit overwrites the server.
   * A lower revision does not move the cursor backwards.
   */
  public async applyServerChangesAndRevision(
    changes: Change[],
    revision: number,
  ): Promise<Change[]> {
    const db = await this.database.getDatabase();
    return commitReadWrite(db, [...SERVER_STORES], async tx => {
      const pending = await tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).getAll();
      const pendingIds = new Set(pending.map(entry => entry.entityId));
      const applied: Change[] = [];

      for (const change of changes) {
        const entityId = change.object?.id;
        if (entityId && pendingIds.has(entityId)) {
          continue;
        }
        await this.writeServerChange(tx, change);
        applied.push(change);
      }

      const current = await tx.objectStore(DATABASE_CONFIG.STORES.META).get(SYNCED_REVISION_ID);
      const stored = current?.syncedRevision ?? 0;
      if (revision > stored) {
        await tx.objectStore(DATABASE_CONFIG.STORES.META).put({
          id: SYNCED_REVISION_ID,
          syncedRevision: revision,
        });
      }

      return applied;
    });
  }

  public async removeOutboxEntry(id: string): Promise<void> {
    await this.removeOutboxEntries([id]);
  }

  public async removeOutboxEntries(ids: string[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }
    const db = await this.database.getDatabase();
    await commitReadWrite(db, [DATABASE_CONFIG.STORES.OUTBOX], async tx => {
      for (const id of ids) {
        await tx.objectStore(DATABASE_CONFIG.STORES.OUTBOX).delete(id);
      }
    });
  }

  /** Drops a local row after the server says the entity is already gone. Does not enqueue. */
  public async removeLocalEntity(entity: EChangedEntity, entityId: string): Promise<void> {
    const db = await this.database.getDatabase();
    const storeName =
      entity === EChangedEntity.Tag ? DATABASE_CONFIG.STORES.TAGS : DATABASE_CONFIG.STORES.TASKS;
    await commitReadWrite(db, [storeName], async tx => {
      await tx.objectStore(storeName).delete(entityId);
    });
  }

  private async writeServerChange(tx: LocalTx, change: Change): Promise<void> {
    const entityId = change.object?.id;
    if (!entityId) {
      return;
    }

    if (change.entity === EChangedEntity.Task) {
      if (change.action === EChangeAction.Deleted) {
        await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).delete(entityId);
        return;
      }
      await tx.objectStore(DATABASE_CONFIG.STORES.TASKS).put(change.object as Task);
      return;
    }

    if (change.entity === EChangedEntity.Tag) {
      if (change.action === EChangeAction.Deleted) {
        await tx.objectStore(DATABASE_CONFIG.STORES.TAGS).delete(entityId);
        return;
      }
      await tx.objectStore(DATABASE_CONFIG.STORES.TAGS).put(change.object as Tag);
    }
  }
}
