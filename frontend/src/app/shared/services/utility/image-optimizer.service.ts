import { Injectable } from '@angular/core';
import Compressor from 'compressorjs';

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizerService {
  public optimizeImage(blob: Blob, quality = 0.6): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(blob, {
        quality: quality,
        mimeType: 'image/jpeg',
        success(result) {
          resolve(result);
        },
        error(err) {
          console.log(err.message);
          reject(err);
        },
      });
    });
  }
}
