import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ImageDbService, ImageRecord } from '../infrastructure/image-db.service';
import { ImageOptimizerService } from '../utility/image-optimizer.service';
import { ImageUploaderService } from '../api/image-uploader.service';
import { FetchService } from '../infrastructure/fetch.service';
import { UuidGeneratorService } from '../adapters/uuid-generator.service';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';

export type EnsureUploadedResult = 'uploaded' | 'alreadyRemote' | 'missingBlob' | 'failed';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private hasProbedRemoteImage = false;
  private readonly uploadsInFlight = new Map<string, Promise<EnsureUploadedResult>>();

  constructor(
    private readonly imageDbService: ImageDbService,
    private readonly imageOptimizerService: ImageOptimizerService,
    private readonly imageUploaderService: ImageUploaderService,
    private readonly fetchService: FetchService,
    private readonly uuidGeneratorService: UuidGeneratorService,
    private readonly http: HttpClient,
  ) {}

  public async saveImage(imageUri: string): Promise<string> {
    if (!imageUri) throw new Error('Image URI is required');

    const imageBlob = await this.convertBlobUriToBlob(imageUri);
    const imageId = this.uuidGeneratorService.generate();
    await this.imageDbService.putImage(imageId, imageBlob);

    return imageId;
  }

  public async getImageRecord(imageId: string): Promise<ImageRecord | undefined> {
    return await this.imageDbService.getImage(imageId);
  }

  public async deleteImage(imageId: string): Promise<void> {
    await this.imageDbService.deleteImage(imageId);
  }

  /**
   * `<img src>` does not go through HttpClient. At most one GET per app session
   * so a Drive 403 still reaches the interceptor; a list of broken thumbnails
   * must not each fire their own request.
   */
  public probeRemoteImage(imageId: string): void {
    if (this.hasProbedRemoteImage) {
      return;
    }
    this.hasProbedRemoteImage = true;
    void firstValueFrom(
      this.http.get(`${API_ENDPOINTS.FILES.IMAGE}/${imageId}`, { responseType: 'blob' }),
    ).catch(() => undefined);
  }

  public async convertBlobUriToBlob(imageUri: string, quality: number = 0.6): Promise<Blob> {
    const blob = await this.fetchService.fetchBlob(imageUri);

    const reducedBlob = await this.imageOptimizerService.optimizeImage(blob, quality);

    return reducedBlob;
  }

  public ensureUploaded(imageId: string): Promise<EnsureUploadedResult> {
    const inFlight = this.uploadsInFlight.get(imageId);
    if (inFlight) {
      return inFlight;
    }

    const upload = this.uploadIfNeeded(imageId).finally(() => {
      this.uploadsInFlight.delete(imageId);
    });
    this.uploadsInFlight.set(imageId, upload);
    return upload;
  }

  private async uploadIfNeeded(imageId: string): Promise<EnsureUploadedResult> {
    const record = await this.imageDbService.getImage(imageId);
    if (!record || record.uploaded) {
      return 'alreadyRemote';
    }
    if (!record.blob) {
      return 'missingBlob';
    }

    try {
      await this.imageUploaderService.uploadImageBlob(imageId, record.blob);
      await this.imageDbService.updateImage(imageId, { uploaded: true });
      return 'uploaded';
    } catch (error) {
      console.error(`Failed to upload image ${imageId}:`, error);
      return 'failed';
    }
  }
}
