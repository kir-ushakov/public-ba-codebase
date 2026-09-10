import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { API_ENDPOINTS } from '../constants/api-endpoints.const';
import { ImageService } from '../services/application/image.service';

@Pipe({
  name: 'imageSrc',
  pure: false,
})
export class ImageSrcPipe implements PipeTransform, OnDestroy {
  private currentUrl?: string;
  private latestId?: string;
  private latestValue: SafeUrl | string | null = null;

  constructor(
    private imageService: ImageService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
  ) {}

  transform(id: string | null | undefined, width?: number): SafeUrl | string | null {
    if (!id) {
      this.revokeUrl();
      this.latestId = undefined;
      this.latestValue = null;
      return this.latestValue;
    }

    if (id !== this.latestId) {
      this.latestId = id;
      void this.load(id, width);
    }

    return this.latestValue;
  }

  ngOnDestroy(): void {
    this.revokeUrl();
  }

  private async load(id: string, width?: number): Promise<void> {
    try {
      const record = await this.imageService.getImageRecord(id);
      if (this.latestId !== id) {
        return;
      }

      this.revokeUrl();

      if (record?.blob) {
        this.setObjectUrl(record.blob);
        return;
      }

      const baseUrl = `${API_ENDPOINTS.FILES.IMAGE}/${id}`;
      this.latestValue = width !== undefined ? `${baseUrl}?width=${width}` : baseUrl;
      this.cd.markForCheck();
    } catch {
      if (this.latestId !== id) {
        return;
      }
      this.revokeUrl();
      this.latestValue = null;
      this.cd.markForCheck();
    }
  }

  private setObjectUrl(blob: Blob): void {
    this.currentUrl = URL.createObjectURL(blob);
    this.latestValue = this.sanitizer.bypassSecurityTrustUrl(this.currentUrl); // NOSONAR blob: createObjectURL from in-app Blob, img src only
    this.cd.markForCheck();
  }

  private revokeUrl(): void {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = undefined;
    }
  }
}
