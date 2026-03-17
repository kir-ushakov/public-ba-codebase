import { Injectable } from '@angular/core';
import { ImageDbService, ImageRecord } from '../infrastructure/image-db.service';
import { ImageOptimizerService } from '../utility/image-optimizer.service';
import { ImageUploaderService } from '../api/image-uploader.service';
import { FetchService } from '../infrastructure/fetch.service';
import { UuidGeneratorService } from '../adapters/uuid-generator.service';

@Injectable({ providedIn: 'root' })
export class ImageService {
  constructor(
    private readonly imageDbService: ImageDbService,
    private readonly imageOptimizerService: ImageOptimizerService,
    private readonly imageUploaderService: ImageUploaderService,
    private readonly fetchService: FetchService,
    private readonly uuidGeneratorService: UuidGeneratorService,
  ) {}

  public async saveImage(imageUri: string): Promise<string> {
    if (!imageUri) throw new Error('Image URI is required');

    const imageBlob = await this.convertBlobUriToBlob(imageUri);
    const imageId = this.uuidGeneratorService.generate();
    await this.imageDbService.putImage(imageId, imageBlob);

    return imageId;
  }

  public async getImageRecord(imageId: string): Promise<ImageRecord> {
    return await this.imageDbService.getImage(imageId);
  }

  public async convertBlobUriToBlob(imageUri: string, quality: number = 0.6): Promise<Blob> {
    const blob = await this.fetchService.fetchBlob(imageUri);

    const reducedBlob = await this.imageOptimizerService.optimizeImage(blob, quality);

    return reducedBlob;
  }

  public async uploadImages(): Promise<void> {
    const images = await this.imageDbService.getAllUnuploadedImages();

    await Promise.all(
      images.map(async image => {
        try {
          const blob = image.blob;
          await this.imageUploaderService.uploadImageBlob(image.id, blob);

          // set upload to true + url
          await this.imageDbService.updateImage(image.id, {
            uploaded: true,
          });
        } catch (error) {
          console.error(`Failed to upload image ${image.id}:`, error);
        }
      }),
    );
  }
}

