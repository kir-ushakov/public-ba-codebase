import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ImageDbService, ImageRecord } from './image-db.service';
import { ImageOptimizerService } from '../utility/image-optimizer.service';
import { ImageUploaderService, UploadImageResponseDTO } from '../api/image-uploader.service';

@Injectable({ providedIn: 'root' })
export class ImageService {
  constructor(
    private readonly imageDbService: ImageDbService,
    private readonly imageOptimizerService: ImageOptimizerService,
    private readonly imageUploaderService: ImageUploaderService,
  ) {}

  public async saveImage(imageUri: string): Promise<string> {
    if (!imageUri) throw new Error('Image URI is required');

    const imageBlob = await this.convertBlobUriToBlob(imageUri);
    const imageId = uuidv4();
    await this.imageDbService.putImage(imageId, imageBlob);

    return imageId;
  }

  public async getImageRecord(imageId: string): Promise<ImageRecord> {
    return await this.imageDbService.getImage(imageId);
  }

  public async convertBlobUriToBlob(imageUri: string, quality: number = 0.6): Promise<Blob> {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const reducedBlob = await this.imageOptimizerService.optimizeImage(blob, quality);

    return reducedBlob;
  }

  public async uploadImages(): Promise<void> {
    const images = await this.imageDbService.getAllUnuploadedImages();

    await Promise.all(
      images.map(async image => {
        try {
          const blob = await this.convertBlobUriToBlob(image.uri);
          const res: UploadImageResponseDTO = await this.imageUploaderService.uploadImageBlob(
            image.id,
            blob,
          );
          const imageUrl = `${ImageUploaderService.IMAGE_API_ENDPOINT}/${res.fileId}.${res.extension}`;

          // set upload to true + url
          await this.imageDbService.updateImage(image.id, {
            uploaded: true,
            uri: imageUrl,
          });
        } catch (error) {
          console.error(`Failed to upload image ${image.id}:`, error);
        }
      }),
    );
  }
}
