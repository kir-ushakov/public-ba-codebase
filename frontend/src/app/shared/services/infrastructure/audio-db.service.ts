import { Injectable } from '@angular/core';
import { DatabaseService, DATABASE_CONFIG } from './database.service';

export type AudioRecord = {
  id: string;
  blob?: Blob;
  uploaded: boolean;
};

@Injectable({ providedIn: 'root' })
export class AudioDbService {
  constructor(private databaseService: DatabaseService) {}

  async putAudio(id: string, blob: Blob, uploaded = false): Promise<void> {
    const db = await this.databaseService.getDatabase();
    const record: AudioRecord = { id, blob, uploaded };
    await db.put(DATABASE_CONFIG.STORES.AUDIO, record);
  }

  async getAudio(id: string): Promise<AudioRecord | undefined> {
    const db = await this.databaseService.getDatabase();
    return db.get(DATABASE_CONFIG.STORES.AUDIO, id);
  }

  async deleteAudio(id: string): Promise<void> {
    const db = await this.databaseService.getDatabase();
    await db.delete(DATABASE_CONFIG.STORES.AUDIO, id);
  }

  async updateAudio(id: string, updates: Partial<Omit<AudioRecord, 'id'>>): Promise<void> {
    const db = await this.databaseService.getDatabase();
    const existing = await db.get(DATABASE_CONFIG.STORES.AUDIO, id);
    const merged: AudioRecord = {
      id,
      uploaded: updates.uploaded ?? existing?.uploaded ?? false,
      blob: updates.blob ?? existing?.blob,
    };
    await db.put(DATABASE_CONFIG.STORES.AUDIO, merged);
  }
}
