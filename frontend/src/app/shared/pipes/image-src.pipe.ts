import { Pipe, PipeTransform, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageDbService } from '../services/infrastructure/image-db.service';

@Pipe({
  name: 'imageSrc',
  pure: false,
})
export class ImageSrcPipe implements PipeTransform, OnDestroy {
  private currentUrl?: string;
  private latestId?: string;
  private latestValue: SafeUrl | string | null = null;

  constructor(
    private imageDb: ImageDbService,
    private sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
  ) {}

  transform(id: string | null | undefined): SafeUrl | string | null {
    if (!id) {
      this.revokeUrl();
      this.latestValue = null;
      return this.latestValue;
    }

    if (id !== this.latestId) {
      this.latestId = id;

      this.imageDb
        .getImage(id)
        .then(record => {
          this.revokeUrl();

          if (record?.uploaded && record.uri) {
            this.latestValue = record.uri;
          } else if (record?.blob) {
            this.currentUrl = URL.createObjectURL(record.blob);
            this.latestValue = this.sanitizer.bypassSecurityTrustUrl(this.currentUrl);
          } else {
            this.latestValue = null;
          }

          this.cd.markForCheck();
        })
        .catch(() => {
          this.latestValue = null;
          this.cd.markForCheck();
        });
    }

    return this.latestValue;
  }

  private revokeUrl() {
    if (this.currentUrl) {
      URL.revokeObjectURL(this.currentUrl);
      this.currentUrl = undefined;
    }
  }

  ngOnDestroy() {
    this.revokeUrl();
  }
}
