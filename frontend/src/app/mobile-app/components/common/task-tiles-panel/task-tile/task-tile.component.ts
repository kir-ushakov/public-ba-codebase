import { Component, Input, HostListener, signal, ViewChild, WritableSignal } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskTileAction } from './task-tile.actions';
import { Task } from 'src/app/shared/models/task.model';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from 'src/app/shared/components/ui-elements/spinner/spinner.component';
import { ImageService } from 'src/app/shared/services/infrastructure/image.service';
import { from, map } from 'rxjs';
import { ImageRecord } from 'src/app/shared/services/infrastructure/image-db.service';

@Component({
  selector: 'ba-task-tile',
  templateUrl: './task-tile.component.html',
  styleUrls: ['./task-tile.component.scss'],
  imports: [CommonModule, SpinnerComponent],
})
export class TaskTileComponent {
  @Input() task: Task;
  @HostListener('click') onClick() {
    this.store.dispatch(new MbTaskTileAction.Clicked(this.task.id));
  }

  @ViewChild(SpinnerComponent, { static: false }) spinnerComponent!: SpinnerComponent;

  DEFAULT_IMAGE_WIDTH = 50;

  isLoading = signal(true);

  resizedImageUri: WritableSignal<null | string> = signal(null);

  constructor(
    private store: Store,
    private imageService: ImageService,
  ) {}

  ngAfterViewInit() {
    from(this.imageService.getImageRecord(this.task.imageId))
      .pipe(
        map((imageRecord: ImageRecord) => {
          if (imageRecord.uploaded) {
            const width = this.calculateImageWidth();
            return imageRecord.uri + `?width=${width}`;
          }
          return imageRecord.uri;
        }),
      )
      .subscribe({
        next: resizedImageUri => this.resizedImageUri.set(resizedImageUri),
        error: err => console.error('Failed to load image', err),
      });
  }

  private calculateImageWidth(): number {
    const width =
      this.spinnerComponent?.getNativeElement()?.offsetWidth || this.DEFAULT_IMAGE_WIDTH;

    const dpr = window.devicePixelRatio || 1;
    return dpr * width;
  }
}
