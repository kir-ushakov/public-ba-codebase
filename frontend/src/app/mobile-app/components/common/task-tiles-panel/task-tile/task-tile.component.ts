import { Component, Input, HostListener, signal, ViewChild } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskTileAction } from './task-tile.actions';
import { Task } from 'src/app/shared/models/task.model';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from 'src/app/shared/components/ui-elements/spinner/spinner.component';
import { ImageService } from 'src/app/shared/services/application/image.service';
import { ImageSrcPipe } from 'src/app/shared/pipes/image-src.pipe';

@Component({
  selector: 'ba-task-tile',
  templateUrl: './task-tile.component.html',
  styleUrls: ['./task-tile.component.scss'],
  imports: [CommonModule, SpinnerComponent, ImageSrcPipe],
})
export class TaskTileComponent {
  @Input() task: Task;
  @HostListener('click') onClick() {
    this.store.dispatch(new MbTaskTileAction.Clicked(this.task.id));
  }

  @ViewChild(SpinnerComponent, { static: false }) spinnerComponent!: SpinnerComponent;

  DEFAULT_IMAGE_WIDTH = 50;

  isLoading = signal(true);
  calculatedImageWidth = signal<number | null>(null);

  constructor(
    private store: Store,
    private imageService: ImageService,
  ) {}

  ngAfterViewInit() {
    this.calculateImageWidth();
  }

  private calculateImageWidth(): void {
    const width =
      this.spinnerComponent?.getNativeElement()?.offsetWidth || this.DEFAULT_IMAGE_WIDTH;
    const dpr = window.devicePixelRatio || 1;
    this.calculatedImageWidth.set(dpr * width);
  }
}
