import { Injectable } from '@angular/core';

export interface ImageRecord {
  id: string;
  blob: Blob;
  uploaded: boolean;
}

@Injectable({ providedIn: 'root' })
export class ImageDbService {
  private dbName = 'ImageDatabase';
  private storeName = 'images';
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  public async putImage(id: string, blob: Blob): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const imageRecord: ImageRecord = {
        id,
        blob,
        uploaded: false
      };
      
      const request = store.put(imageRecord);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getImage(id: string): Promise<ImageRecord | null> {
    // Guard against invalid keys - return null instead of throwing
    if (!id || typeof id !== 'string') {
      console.warn(`Invalid image ID provided to getImage: ${id}`);
      return null;
    }
    
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        
        // Use direct get() instead of IDBKeyRange.only()
        const request = store.get(id);
        
        request.onsuccess = () => {
          const result = request.result;
          resolve(result || null);
        };
        
        request.onerror = () => {
          console.error('Error getting image from IndexedDB:', request.error);
          resolve(null); // Return null instead of rejecting
        };
        
        transaction.onerror = () => {
          console.error('Transaction error:', transaction.error);
          resolve(null);
        };
      } catch (error) {
        console.error('Error in getImage:', error);
        resolve(null);
      }
    });
  }

  public async getAllUnuploadedImages(): Promise<ImageRecord[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allImages = request.result || [];
        const unuploadedImages = allImages.filter(image => !image.uploaded);
        resolve(unuploadedImages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  public async updateImage(id: string, updates: Partial<ImageRecord>): Promise<void> {
    // Guard against invalid keys
    if (!id || typeof id !== 'string') {
      console.warn(`Invalid image ID provided to updateImage: ${id}`);
      return;
    }
    
    const db = await this.ensureDB();
    const existingImage = await this.getImage(id);
    
    if (!existingImage) {
      console.warn(`Image with ID ${id} not found for update`);
      return;
    }
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const updatedImage = { ...existingImage, ...updates };
        const request = store.put(updatedImage);
        
        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('Error updating image:', request.error);
          resolve(); // Don't reject, just log and continue
        };
        
        transaction.onerror = () => {
          console.error('Transaction error during update:', transaction.error);
          resolve();
        };
      } catch (error) {
        console.error('Error in updateImage:', error);
        resolve();
      }
    });
  }
}