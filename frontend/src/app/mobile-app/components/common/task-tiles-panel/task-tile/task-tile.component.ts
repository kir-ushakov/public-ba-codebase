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
  /** 
    #NOTE: 
    This tells Angular to query for an instance of SpinnerComponent
    after the view has been initialized ({ static: false })
  */
  @ViewChild(SpinnerComponent, { static: false }) spinnerComponent!: SpinnerComponent;

  DEFAULT_IMAGE_WIDTH = 50;

  /**
   *
   * #NOTE:
   * Use this property to display the spinner as a placeholder for the thumbnail.
   */
  isLoading = signal(true);
  // #NOTE: Set to null initially to prevent loading until the width has been calculated
  resizedImageUri: WritableSignal<null | string> = signal(null);

  constructor(private store: Store) {}

  ngAfterViewInit() {
    let imageUri = this.task.imageUri;

    /**
     * #NOTE
     * Add the width query parameter only if the image is retrieved from the API.
     * If the image comes from the device's local storage, no modification is needed.
     */
    if (!this.isLocalImage(imageUri)) {
      const width = this.calculateImageWidth();
      imageUri = imageUri + `?width=${width}`;
    }

    /**
     * #NOTE:
     * The resizedImageUri signal property triggers the image loading process automatically
     * because in the template, we bind it to [src] using [src]="resizedImageUri()".
     */
    this.resizedImageUri.set(imageUri);
  }

  private calculateImageWidth(): number {
    /**
     * #NOTE:
     * Use the spinner's native element to dynamically determine its width
     */
    const width =
      this.spinnerComponent?.getNativeElement()?.offsetWidth || this.DEFAULT_IMAGE_WIDTH;
    /**
     * #NOTE: Device Pixel Ratio (DPR) factor in modern high-DPI screens determines
     * how many physical pixels exist per CSS pixel.
     */
    const dpr = window.devicePixelRatio || 1;
    return dpr * width;
  }

  private isLocalImage(url: string): boolean {
    if (!url) return false;

    return url.startsWith('blob:');
  }
}
