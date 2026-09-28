import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { ImageSrcPipe } from 'src/app/shared/pipes/image-src.pipe';
import { formatAttachedImageCount } from '../helpers/format-attached-image-count.function';
import type { GalleryImage } from '../helpers/to-gallery-images.function';

@Component({
  selector: 'ba-image-gallery-editor',
  imports: [ImageSrcPipe],
  templateUrl: './image-gallery-editor.component.html',
  styleUrl: './image-gallery-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageGalleryEditorComponent {
  readonly images = input<GalleryImage[]>([]);
  readonly presentation = input<'editor' | 'view'>('editor');
  readonly addImage = output<void>();
  readonly selectCover = output<GalleryImage>();
  readonly removeImage = output<GalleryImage>();
  readonly isView = computed(() => this.presentation() === 'view');
  readonly heading = computed(() =>
    this.isView() ? `Images (${this.images().length})` : 'Images',
  );
  readonly countLabel = computed(() => formatAttachedImageCount(this.images().length));

  onAddImage(): void {
    if (this.isView()) {
      return;
    }

    this.addImage.emit();
  }

  onSelectCover(image: GalleryImage): void {
    if (this.isView()) {
      return;
    }

    this.selectCover.emit(image);
  }

  onRemoveImage(image: GalleryImage): void {
    this.removeImage.emit(image);
  }
}
