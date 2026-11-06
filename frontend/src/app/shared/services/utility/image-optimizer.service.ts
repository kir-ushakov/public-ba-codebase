import { Injectable } from '@angular/core';
import { ImageConst } from '@brainassistant/contracts';
import Compressor from 'compressorjs';

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizerService {
  public async optimizeImage(blob: Blob): Promise<Blob> {
    for (const [longEdge, quality] of ImageConst.ENCODE_PLAN) {
      const encoded = await this.compress(blob, longEdge, quality);
      if (encoded.type === 'image/webp' && encoded.size <= ImageConst.MAX_BYTES) {
        return encoded;
      }
    }

    throw new Error('Image could not be stored within the size limit');
  }

  private compress(blob: Blob, longEdge: number, quality: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(blob, {
        strict: false,
        checkOrientation: true,
        maxWidth: longEdge,
        maxHeight: longEdge,
        quality: quality / 100,
        mimeType: 'image/webp',
        success(result) {
          resolve(result);
        },
        error(err) {
          reject(err);
        },
      });
    });
  }
}
