import { Injectable } from '@angular/core';
import { ImageConst } from '@brainassistant/contracts';
import Compressor from 'compressorjs';
import {
  ImageStoreEncodeAttempt,
  imageStoreEncodePlan,
} from '../../helpers/image-store-encode-plan.function';

@Injectable({
  providedIn: 'root',
})
export class ImageOptimizerService {
  public async optimizeImage(blob: Blob): Promise<Blob> {
    for (const attempt of imageStoreEncodePlan()) {
      const encoded = await this.compress(blob, attempt);
      if (encoded.type === 'image/webp' && encoded.size <= ImageConst.MAX_BYTES) {
        return encoded;
      }
    }

    throw new Error('Image could not be stored within the size limit');
  }

  private compress(blob: Blob, attempt: ImageStoreEncodeAttempt): Promise<Blob> {
    return new Promise((resolve, reject) => {
      new Compressor(blob, {
        strict: false,
        checkOrientation: true,
        maxWidth: attempt.longEdge,
        maxHeight: attempt.longEdge,
        quality: attempt.quality / 100,
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
