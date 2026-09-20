import { Component, ElementRef, Input, HostListener, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { TaskTileAction } from './task-tile.actions';
import { ETaskViewMode } from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
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
  host: {
    '[class.is-menu-open]': 'isMenuOpen()',
  },
})
export class TaskTileComponent {
  @Input() task!: Task;
  @HostListener('click') onClick() {
    if (this.isMenuOpen()) {
      return;
    }
    void this.router.navigate([`task/${ETaskViewMode.View}/${this.task.id}`]);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closeMenu();
  }

  @ViewChild(SpinnerComponent, { static: false }) spinnerComponent!: SpinnerComponent;

  DEFAULT_IMAGE_WIDTH = 50;

  isLoading = signal(true);
  calculatedImageWidth = signal<number | undefined>(undefined);
  readonly isMenuOpen = signal(false);

  constructor(
    private store: Store,
    private imageService: ImageService,
    private host: ElementRef<HTMLElement>,
    private router: Router,
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
    this.isMenuOpen.update(isOpen => !isOpen);
  }

  closeMenu(event?: Event): void {
    event?.stopPropagation();
    this.isMenuOpen.set(false);
  }

  editTask(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    void this.router.navigate([`task/${ETaskViewMode.Edit}/${this.task.id}`]);
  }

  deleteTask(event: Event): void {
    event.stopPropagation();
    this.closeMenu();
    this.store.dispatch(new TaskTileAction.DeleteSelected(this.task.id));
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
