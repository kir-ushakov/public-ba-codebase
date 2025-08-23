import { Injectable } from '@angular/core';
import { DatabaseService, AppDB, DATABASE_CONFIG } from './database.service';

interface ImageRecord {
  id: string;
  blob?: Blob;
  uploaded: boolean;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class ImageDbService {
  constructor(private databaseService: DatabaseService) {}

  /** Save or update image record */
  async putImage(id: string, blob: Blob | null, uploaded: boolean, url?: string): Promise<void> {
    const db = await this.databaseService.getDatabase();
    const record: ImageRecord = { id, uploaded, url };
    if (blob) {
      record.blob = blob;
    }
    await db.put(DATABASE_CONFIG.STORES.IMAGES, record);
  }

  /** Get image record by id */
  async getImage(id: string): Promise<ImageRecord | undefined> {
    const db = await this.databaseService.getDatabase();
    return db.get(DATABASE_CONFIG.STORES.IMAGES, id);
  }

  /** Delete image record */
  async deleteImage(id: string): Promise<void> {
    const db = await this.databaseService.getDatabase();
    await db.delete(DATABASE_CONFIG.STORES.IMAGES, id);
  }

  /** Get all image records */
  async getAllImages(): Promise<ImageRecord[]> {
    const db = await this.databaseService.getDatabase();
    return db.getAll(DATABASE_CONFIG.STORES.IMAGES);
  }
}
