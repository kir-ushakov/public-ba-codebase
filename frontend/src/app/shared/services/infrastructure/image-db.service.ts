import { Injectable } from '@angular/core';
import { DatabaseService, AppDB, DATABASE_CONFIG } from './database.service';

export interface ImageRecord {
  id: string;
  blob?: Blob;
  uploaded: boolean;
  uri?: string;
}

@Injectable({ providedIn: 'root' })
export class ImageDbService {
  constructor(private databaseService: DatabaseService) {}

  async putImage(
    id: string,
    blob: Blob | null,
    uploaded: boolean = false,
    uri?: string,
  ): Promise<void> {
    const db = await this.databaseService.getDatabase();
    const record: ImageRecord = { id, uploaded, uri };
    if (blob) {
      record.blob = blob;
    }
    await db.put(DATABASE_CONFIG.STORES.IMAGES, record);
  }

  async getImage(id: string): Promise<ImageRecord | undefined> {
    const db = await this.databaseService.getDatabase();
    return db.get(DATABASE_CONFIG.STORES.IMAGES, id);
  }

  async deleteImage(id: string): Promise<void> {
    const db = await this.databaseService.getDatabase();
    await db.delete(DATABASE_CONFIG.STORES.IMAGES, id);
  }

  async getAllUnuploadedImages(): Promise<ImageRecord[]> {
    const db = await this.databaseService.getDatabase();
    return db.getAllFromIndex(DATABASE_CONFIG.STORES.IMAGES, 'uploaded', IDBKeyRange.only(false));
  }

  async updateImage(id: string, updates: Partial<Omit<ImageRecord, 'id'>>): Promise<void> {
    const db = await this.databaseService.getDatabase();
    const existing: any = await db.get(DATABASE_CONFIG.STORES.IMAGES, id);

    const merged: ImageRecord = {
      id,
      uploaded: updates.uploaded ?? existing?.uploaded ?? false,
      uri: updates.uri ?? existing?.uri ?? existing?.url,
      blob: updates.blob ?? existing?.blob,
    };

    await db.put(DATABASE_CONFIG.STORES.IMAGES, merged);
  }
}
