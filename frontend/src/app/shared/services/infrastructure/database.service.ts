import { Injectable } from '@angular/core';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Database constants
export const DATABASE_CONFIG = {
  NAME: 'ba-db',
  VERSION: 1,
  STORES: {
    IMAGES: 'images',
    // Add future stores here
    // USERS: 'users',
    // SETTINGS: 'settings',
  },
} as const;

// Database schema interfaces
interface ImageRecord {
  id: string;
  blob?: Blob;
  uploaded: boolean;
  url?: string;
}

// Main database interface - extend this as you add more stores
export interface AppDB extends DBSchema {
  [DATABASE_CONFIG.STORES.IMAGES]: {
    key: string;
    value: ImageRecord;
  };
  // Future stores will be added here
  // [DATABASE_CONFIG.STORES.USERS]: {
  //   key: string;
  //   value: UserRecord;
  // };
}

@Injectable({ providedIn: 'root' })
export class DatabaseService {
  private dbPromise: Promise<IDBPDatabase<AppDB>>;

  constructor() {
    this.dbPromise = openDB<AppDB>(DATABASE_CONFIG.NAME, DATABASE_CONFIG.VERSION, {
      upgrade: (db, oldVersion, newVersion) => {
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        this.handleUpgrade(db, oldVersion, newVersion);
      },
    });
  }

  /**
   * Centralized upgrade handler for all database schema changes
   */
  private handleUpgrade(db: IDBPDatabase<AppDB>, oldVersion: number, newVersion: number): void {
    // Version 1: Initial setup
    if (oldVersion < 1) {
      // Create images store
      if (!db.objectStoreNames.contains(DATABASE_CONFIG.STORES.IMAGES)) {
        db.createObjectStore(DATABASE_CONFIG.STORES.IMAGES, { keyPath: 'id' });
        console.log(`Created ${DATABASE_CONFIG.STORES.IMAGES} store`);
      }
    }

    // Future versions will be added here as needed
    // Example:
    // if (oldVersion < 2) {
    //   // Add new store or modify existing
    // }
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
