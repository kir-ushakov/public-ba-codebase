import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { map } from 'rxjs/operators';
import type { Observable } from 'rxjs';
import { TaskScreenAction } from '../task-screen.actions';
import { TaskScreenState } from '../task-screen.state';
import type { DefaultTask, Task, TaskDescriptionDoc } from 'src/app/shared/models/task.model';
import { isEmptyTaskDescription } from 'src/app/shared/helpers/is-empty-task-description.function';
import { TaskTypeChipComponent } from '../task-type-chip/task-type-chip.component';
import { ImageGalleryEditorComponent } from '../task-edit/image-gallery-editor/image-gallery-editor.component';
import { TagSelectorComponent } from '../task-edit/tag-selector/tag-selector.component';
import {
  toGalleryImages,
  type GalleryImage,
} from '../task-edit/helpers/to-gallery-images.function';
import { renderTaskDescriptionHtml } from './helpers/render-task-description-html.function';

type TaskViewContent = {
  task: Task | DefaultTask;
  descriptionHtml: string;
};

@Component({
  selector: 'ba-task-view',
  imports: [CommonModule, TaskTypeChipComponent, ImageGalleryEditorComponent, TagSelectorComponent],
  templateUrl: './task-view.component.html',
  styleUrl: './task-view.component.scss',
})
export class TaskViewComponent {
  readonly galleryImages = computed(() =>
    toGalleryImages(this.draftImages(), this.task().imageId, this.coverDraftKey()),
  );
  readonly view$: Observable<TaskViewContent>;

  private readonly store = inject(Store);
  private readonly draftImages = this.store.selectSignal(TaskScreenState.draftImages);
  private readonly coverDraftKey = this.store.selectSignal(TaskScreenState.coverDraftKey);
  private readonly task = this.store.selectSignal(TaskScreenState.task);

  constructor() {
    this.view$ = this.store.select(TaskScreenState.task).pipe(
      map(task => ({
        task,
        descriptionHtml: descriptionHtml(task.description),
      })),
    );
  }

  addPhoto(): void {
    this.store.dispatch(TaskScreenAction.AddPictureBtnPressed);
  }

  imageSelectedAsCover(image: GalleryImage): void {
    this.store.dispatch(
      new TaskScreenAction.ImageSelectedAsCover({
        imageId: image.imageId,
        previewUrl: image.previewUrl,
      }),
    );
  }

  draftImageRemoved(image: GalleryImage): void {
    this.store.dispatch(
      new TaskScreenAction.DraftImageRemoved({
        imageId: image.imageId,
        previewUrl: image.previewUrl,
      }),
    );
  }
}

function descriptionHtml(description: TaskDescriptionDoc | undefined): string {
  if (description === undefined || isEmptyTaskDescription(description)) {
    return '';
  }

  return renderTaskDescriptionHtml(description);
}
