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
  readonly addImage = output<void>();
  readonly countLabel = computed(() => formatAttachedImageCount(this.images().length));

  onAddImage(): void {
    this.addImage.emit();
  }
}
