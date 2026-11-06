import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { remoteTaskTileImage } from './helpers/task-tile-image.function';

export type TaskTileImage = {
  src: SafeUrl | string;
  srcset: string | null;
  sizes: string | null;
};

@Pipe({
  name: 'taskTileImage',
  pure: false,
})
export class TaskTileImagePipe implements PipeTransform, OnDestroy {
  private currentUrl?: string;
  private latestId?: string;
  private latestValue: TaskTileImage | null = null;

  constructor(
    private imageService: ImageService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
  ) {}

  transform(id: string | null | undefined): TaskTileImage | null {
    if (!id) {
      this.revokeUrl();
      this.latestId = undefined;
      this.latestValue = null;
      return null;
    }

    if (id !== this.latestId) {
      this.latestId = id;
      void this.load(id);
    }

    return this.latestValue;
  }

  ngOnDestroy(): void {
    this.revokeUrl();
  }

  private async load(id: string): Promise<void> {
    try {
      const record = await this.imageService.getImageRecord(id);
      if (this.latestId !== id) {
        return;
      }

      this.revokeUrl();

      if (record?.blob) {
        this.currentUrl = URL.createObjectURL(record.blob);
        this.latestValue = {
          src: this.sanitizer.bypassSecurityTrustUrl(this.currentUrl), // NOSONAR blob: createObjectURL from in-app Blob, img src only
          srcset: null,
          sizes: null,
        };
        this.cd.markForCheck();
        return;
      }

      const remote = remoteTaskTileImage(id);
      this.latestValue = remote
        ? { src: remote.src, srcset: remote.srcset, sizes: remote.sizes }
        : null;
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

  private revokeUrl(): void {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = undefined;
    }
  }
}
