import { Component, ElementRef, Input, HostListener, signal, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskTileAction } from './task-tile.actions';
import { Task } from 'src/app/shared/models/task.model';
import { SpinnerComponent } from 'src/app/shared/components/ui-elements/spinner/spinner.component';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { ImageSrcPipe } from 'src/app/shared/pipes/image-src.pipe';
import { formatTaskTileDate } from './helpers/format-task-tile-date.function';
import { taskTypeIcon } from './helpers/task-type-icon.function';

@Component({
  selector: 'ba-task-tile',
  templateUrl: './task-tile.component.html',
  styleUrls: ['./task-tile.component.scss'],
  imports: [SpinnerComponent, ImageSrcPipe],
})
export class TaskTileComponent {
  @Input() task!: Task;
  @HostListener('click') onClick() {
    this.store.dispatch(new MbTaskTileAction.Clicked(this.task.id));
  }

  @ViewChild(SpinnerComponent, { static: false }) spinnerComponent!: SpinnerComponent;

  DEFAULT_IMAGE_WIDTH = 50;

  isLoading = signal(true);
  calculatedImageWidth = signal<number | undefined>(undefined);

  constructor(
    private store: Store,
    private imageService: ImageService,
    private host: ElementRef<HTMLElement>,
  ) {}

  get typeIcon(): string {
    return taskTypeIcon(this.task.type);
  }

  get createdAtLabel(): string {
    return formatTaskTileDate(this.task.createdAt);
  }

  ngAfterViewInit() {
    this.calculateImageWidth();
  }

  onMoreClick(event: Event): void {
    event.stopPropagation();
  }

  onImageError(event: Event): void {
    this.isLoading.set(false);
    if (!this.isRemoteImageEvent(event) || !this.task.imageId) {
      return;
    }
    this.imageService.probeRemoteImage(this.task.imageId);
  }

  private isRemoteImageEvent(event: Event): boolean {
    const image = event.target;
    return image instanceof HTMLImageElement && !image.src.startsWith('blob:');
  }

  private calculateImageWidth(): void {
    const width =
      this.host.nativeElement.offsetWidth ||
      this.spinnerComponent?.getNativeElement()?.offsetWidth ||
      this.DEFAULT_IMAGE_WIDTH;
    const dpr = window.devicePixelRatio || 1;
    this.calculatedImageWidth.set(dpr * width);
  }
}
