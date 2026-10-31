import { Injectable } from '@angular/core';
import { DBSchema, IDBPDatabase, openDB } from 'idb';
import { benchMark, benchMeasure } from '../../../benchmark/bench-marks';
import { OutboxEntry } from '../../models/outbox-entry.type';
import { Tag } from '../../models/tag.model';
import { Task } from '../../models/task.model';

export const DATABASE_CONFIG = {
  VERSION: 3,
  STORES: {
    IMAGES: 'images' as const,
    TASKS: 'tasks' as const,
    TAGS: 'tags' as const,
    OUTBOX: 'outbox' as const,
    META: 'meta' as const,
  },
} as const;

export const SYNCED_REVISION_ID = 'syncedRevision';

/** Old NGXS storage-plugin key from `keys: '*'`. Removed only after this database opens. */
export const LEGACY_NGXS_STATE_KEY = '@@STATE';

export function userDatabaseName(userId: string): string {
  return `ba-${userId}`;
}

type ImageRecord = {
  id: string;
  blob?: Blob;
  uploaded: boolean;
  url?: string;
};

export type SyncMetaRecord = {
  id: string;
  syncedRevision: number;
};

export interface AppDB extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
    indexes: { uploaded: IDBValidKey };
  };
  tasks: {
    key: string;
    value: Task;
  };
  tags: {
    key: string;
    value: Tag;
  };
  outbox: {
    key: string;
    value: OutboxEntry;
    indexes: { entityId: string };
  };
  meta: {
    key: string;
    value: SyncMetaRecord;
  };
}

function upgradeDatabase(db: IDBPDatabase<AppDB>): void {
  if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.IMAGES)) {
    const images = db.createObjectStore(DATABASE_CONFIG.STORES.IMAGES, { keyPath: 'id' });
    images.createIndex('uploaded', 'uploaded', { unique: false });
  }

  if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.TASKS)) {
    db.createObjectStore(DATABASE_CONFIG.STORES.TASKS, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.TAGS)) {
    db.createObjectStore(DATABASE_CONFIG.STORES.TAGS, { keyPath: 'id' });
  }

  if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.OUTBOX)) {
    const outbox = db.createObjectStore(DATABASE_CONFIG.STORES.OUTBOX, { keyPath: 'id' });
    outbox.createIndex('entityId', 'entityId', { unique: false });
  }

  if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.META)) {
    db.createObjectStore(DATABASE_CONFIG.STORES.META, { keyPath: 'id' });
  }
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private currentUserId: string | null = null;
  private dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

  public async open(userId: string): Promise<void> {
    if (this.currentUserId === userId && this.dbPromise) {
      await this.dbPromise;
      return;
    }

    benchMark('ba:idb-open:start');
    await this.close();
    this.currentUserId = userId;
    this.dbPromise = openDB<AppDB>(userDatabaseName(userId), DATABASE_CONFIG.VERSION, {
      upgrade(db) {
        upgradeDatabase(db);
      },
    });
    await this.dbPromise;
    benchMark('ba:idb-open:end');
    benchMeasure('ba:idb-open', 'ba:idb-open:start', 'ba:idb-open:end');
  }

  public async close(): Promise<void> {
    if (!this.dbPromise) {
      this.currentUserId = null;
      return;
    }

    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
    this.currentUserId = null;
  }

  public async getDatabase(): Promise<IDBPDatabase<AppDB>> {
    if (!this.dbPromise) {
      throw new Error('Local database is not open');
    }
    return this.dbPromise;
  }

  public async getDatabaseInfo(): Promise<{ name: string; version: number; stores: string[] }> {
    const db = await this.getDatabase();
    return {
      name: db.name,
      version: db.version,
      stores: Array.from(db.objectStoreNames),
    };
  }

  public async clearAllData(): Promise<void> {
    const db = await this.getDatabase();
    const stores = [
      DATABASE_CONFIG.STORES.IMAGES,
      DATABASE_CONFIG.STORES.TASKS,
      DATABASE_CONFIG.STORES.TAGS,
      DATABASE_CONFIG.STORES.OUTBOX,
      DATABASE_CONFIG.STORES.META,
    ] as const;
    const tx = db.transaction(stores, 'readwrite');
    await Promise.all(stores.map(storeName => tx.objectStore(storeName).clear()));
    await tx.done;
  }
}
