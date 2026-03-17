import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { distinctUntilChanged, map, tap } from 'rxjs/operators';
import { MbTaskScreenState } from '../mb-task-screen.state';
import { Task } from 'src/app/shared/models/task.model';
import { ImageSrcPipe } from 'src/app/shared/pipes/image-src.pipe';
import { SpinnerComponent } from 'src/app/shared/components/ui-elements/spinner/spinner.component';

@Component({
  selector: 'ba-mb-task-view',
  imports: [CommonModule, ImageSrcPipe, SpinnerComponent],
  templateUrl: './mb-task-view.component.html',
  styleUrl: './mb-task-view.component.scss',
})
export class MbTaskViewComponent {
  private store = inject(Store);
  task$: Observable<Task> = this.store.select(MbTaskScreenState.task);

  isImageLoading = signal(true);

  constructor() {
    this.task$
      .pipe(
        map(task => task?.imageId ?? null),
        distinctUntilChanged(),
        tap(imageId => this.isImageLoading.set(!!imageId)),
        takeUntilDestroyed(),
      )
      .subscribe();
  }
}
