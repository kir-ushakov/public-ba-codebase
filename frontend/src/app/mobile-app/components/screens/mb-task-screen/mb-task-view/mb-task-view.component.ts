import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, signal } from '@angular/core';
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
export class MbTaskViewComponent implements OnInit {
  task$: Observable<Task>;

  private currentImageId: string | null = null;
  isImageLoading = signal(true);

  constructor(private store: Store, private destroyRef: DestroyRef) {
    this.task$ = this.store.select(MbTaskScreenState.task);
  }

  ngOnInit(): void {
    this.task$
      .pipe(
        map(task => task?.imageId ?? null),
        distinctUntilChanged(),
        tap(imageId => {
          this.currentImageId = imageId;
          this.isImageLoading.set(!!imageId);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  onImageLoaded(imageId: string): void {
    if (this.currentImageId === imageId) {
      this.isImageLoading.set(false);
    }
  }

  onImageError(imageId: string): void {
    if (this.currentImageId === imageId) {
      this.isImageLoading.set(false);
    }
  }
}
