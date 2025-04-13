import {
  Component,
  Input,
  HostListener,
  signal,
  ViewChild,
  ElementRef,
  Signal,
  WritableSignal,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskTileAction } from './task-tile.actions';
import { Task } from 'src/app/shared/models/task.model';
import { CommonModule } from '@angular/common';
import { SpinnerComponent } from 'src/app/shared/components/ui-elements/spinner/spinner.component';

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

  constructor(private store: Store) {}

  ngAfterViewInit() {
    let imageUri = this.task.imageUri;

    if (!this.isLocalImage(imageUri)) {
      const width = this.calculateImageWidth();
      imageUri = imageUri + `?width=${width}`;
    }

    this.resizedImageUri.set(imageUri);
  }

  private calculateImageWidth(): number {
    const width =
      this.spinnerComponent?.getNativeElement()?.offsetWidth || this.DEFAULT_IMAGE_WIDTH;

    const dpr = window.devicePixelRatio || 1;
    return dpr * width;
  }

  private isLocalImage(url: string): boolean {
    if (!url) return false;

    return url.startsWith('blob:');
  }
}
