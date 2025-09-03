import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database constants
export const DATABASE_CONFIG = {
  NAME: 'ba-db',
  VERSION: 2,
  STORES: {
    IMAGES: 'images' as const, // runtime name
  },
} as const;

// Database schema interfaces
interface ImageRecord {
  id: string;
  blob?: Blob;
  uploaded: boolean;
  url?: string;
}

export interface AppDB extends DBSchema {
  images: {
    key: string;
    value: ImageRecord;
    indexes: {
      uploaded: IDBValidKey;
    };
  };
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<AppDB>>;

  constructor() {
    this.dbPromise = openDB<AppDB>(DATABASE_CONFIG.NAME, DATABASE_CONFIG.VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from v${oldVersion} to v${newVersion}`);

        switch (oldVersion) {
          case 0:
            // First install → create store
            const store = db.createObjectStore(DATABASE_CONFIG.STORES.IMAGES, {
              keyPath: 'id',
            });
            store.createIndex('uploaded', 'uploaded', { unique: false });
            break;

          case 1:
            // Migration from v1 → v2
            const imageStore = transaction.objectStore(DATABASE_CONFIG.STORES.IMAGES);
            if (!imageStore.indexNames.contains('uploaded')) {
              imageStore.createIndex('uploaded', 'uploaded', { unique: false });
            }
            break;

          default:
            // For future migrations
            console.warn(`No specific migration for v${oldVersion}`);
        }
      },
    });
  }

  /**
   * Get the database instance
   */
  getDatabase(): Promise<IDBPDatabase<AppDB>> {
    return this.dbPromise;
  }

  /**
   * Get database info for debugging
   */
  async getDatabaseInfo(): Promise<{ name: string; version: number; stores: string[] }> {
    const db = await this.dbPromise;
    return {
      name: db.name,
      version: db.version,
      stores: Array.from(db.objectStoreNames),
    };
  }

  /**
   * Clear all data from all stores (useful for testing/reset)
   */
  async clearAllData(): Promise<void> {
    const db = await this.dbPromise;
    const stores = Array.from(db.objectStoreNames);

    for (const storeName of stores) {
      await db.clear(storeName);
    }
    console.log('Cleared all data from database');
  }
}
