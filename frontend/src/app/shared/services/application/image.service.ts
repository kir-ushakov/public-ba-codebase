import { Injectable, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { ImageDbService, ImageRecord } from '../infrastructure/image-db.service';
import { ImageOptimizerService } from '../utility/image-optimizer.service';
import { ImageUploaderService } from '../api/image-uploader.service';
import { FetchService } from '../infrastructure/fetch.service';
import { UuidGeneratorService } from '../adapters/uuid-generator.service';
import { isGoogleRefreshTokenInvalidError } from '../../helpers/google-refresh-token-invalid.function';
import { AppAction } from '../../state/app.actions';
import { API_ENDPOINTS } from '../../constants/api-endpoints.const';

@Injectable({ providedIn: 'root' })
export class ImageService {
  private hasProbedRemoteImage = false;

  constructor(
    private readonly imageDbService: ImageDbService,
    private readonly imageOptimizerService: ImageOptimizerService,
    private readonly imageUploaderService: ImageUploaderService,
    private readonly fetchService: FetchService,
    private readonly uuidGeneratorService: UuidGeneratorService,
    private readonly injector: Injector,
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

  public async uploadImages(): Promise<void> {
    const images = await this.imageDbService.getAllUnuploadedImages();

    await Promise.all(
      images.map(async image => {
        try {
          const blob = image.blob;
          if (!blob) {
            return;
          }
          await this.imageUploaderService.uploadImageBlob(image.id, blob);

          // set upload to true + url
          await this.imageDbService.updateImage(image.id, {
            uploaded: true,
          });
        } catch (error) {
          console.error(`Failed to upload image ${image.id}:`, error);
          if (isGoogleRefreshTokenInvalidError(error)) {
            this.injector.get(Store).dispatch(new AppAction.GoogleRefreshTokenInvalid());
          }
        }
      }),
    );
  }
}
