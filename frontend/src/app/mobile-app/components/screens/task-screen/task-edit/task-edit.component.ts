import { Component, computed, DestroyRef, inject, NgZone, output, ViewChild } from '@angular/core';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { TaskScreenAction } from '../task-screen.actions';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import type { FormGroup } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { take } from 'rxjs';
import type { Observable } from 'rxjs';
import { ETaskViewMode, TaskScreenState } from '../task-screen.state';
import { VoiceInputState } from 'src/app/shared/features/voice-input/state/voice-input.state';
import { VoiceInputAction } from 'src/app/shared/features/voice-input/state/voice-input.actions';
import type { FormControlsOf } from 'src/app/shared/forms/types/form-controls-of';
import type { ITaskEditFormData } from './task-edit.component.interface';
import { TaskConst, type TaskDescriptionDoc } from '@brainassistant/contracts';
import { VoiceInputTriggerComponent } from 'src/app/shared/features/voice-input/components/voice-input-trigger/voice-input-trigger.component';
import { clipVoiceTaskTitle } from './helpers/clip-voice-task-title.function';
import { stripTitleNewlines } from './helpers/strip-title-newlines.function';
import { RichTextEditorComponent } from 'src/app/shared/components/ui-elements/rich-text-editor/rich-text-editor.component';
import { ImageGalleryEditorComponent } from './image-gallery-editor/image-gallery-editor.component';
import { toGalleryImages } from './helpers/to-gallery-images.function';

@Component({
  selector: 'ba-task-edit',
  imports: [
    CommonModule,
    CdkTextareaAutosize,
    VoiceInputTriggerComponent,
    RichTextEditorComponent,
    ImageGalleryEditorComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.scss',
})
export class TaskEditComponent {
  @ViewChild('titleAutosize') titleAutosize?: CdkTextareaAutosize;
  formValidStatus = output<boolean>();
  voiceToTextConverting$: Observable<boolean> = inject(Store).select(
    VoiceInputState.voiceToTextConverting,
  );
  form!: FormGroup<FormControlsOf<ITaskEditFormData>>;

  TaskScreenState = TaskScreenState;
  readonly titleMaxLength = TaskConst.TITLE_MAX_LENGTH;
  titleLength = 0;
  readonly galleryImages = computed(() =>
    toGalleryImages(this.draftImages(), this.editedTask().imageId),
  );

  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  private readonly draftImages = this.store.selectSignal(TaskScreenState.draftImages);
  private readonly editedTask = this.store.selectSignal(TaskScreenState.task);
  private readonly fb = inject(FormBuilder);
  private readonly actions$ = inject(Actions);
  private readonly ngZone = inject(NgZone);

  private readonly baseTitleValidators = [Validators.maxLength(TaskConst.TITLE_MAX_LENGTH)];
  private readonly requiredTitleValidators = [Validators.required, ...this.baseTitleValidators];

  ngOnInit(): void {
    this.buildForm();
    this.store.dispatch(
      new TaskScreenAction.UpdateFormData(this.form.valid, this.form.getRawValue()),
    );
    this.initSubscriptions();
  }

  ngAfterViewInit(): void {
    this.resizeTitleField();
  }

  addPictureBtnPressed(): void {
    this.store.dispatch(TaskScreenAction.AddPictureBtnPressed);
  }

  onVoiceRecordingStopped(): void {
    this.form.controls.title?.setValue('');
    this.resizeTitleField();
  }

  private initSubscriptions(): void {
    const titleControl = this.form.controls.title;
    if (titleControl) {
      titleControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
        const sanitized = stripTitleNewlines(value ?? '');
        if (sanitized !== value) {
          titleControl.setValue(sanitized);
          return;
        }
        this.titleLength = sanitized.length;
      });
    }

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.store.dispatch(
        new TaskScreenAction.UpdateFormData(this.form.valid, this.form.getRawValue()),
      );
    });

    this.store
      .select(TaskScreenState.draftImages)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(drafts => {
        this.updateTitleValidation(drafts.length === 0);
      });

    this.voiceToTextConverting$.subscribe(converting => {
      const control = this.form.get('title');
      if (!control) return;

      if (converting && control.enabled) {
        control.disable({ emitEvent: false });
      } else if (!converting && control.disabled) {
        control.enable({ emitEvent: false });
      }
    });

    this.actions$
      .pipe(
        ofActionDispatched(VoiceInputAction.VoiceToTextConvertedSuccessfully),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload: { text: string }) => {
        this.form.controls.title?.setValue(clipVoiceTaskTitle(stripTitleNewlines(payload.text)));
        this.resizeTitleField();
      });
  }

  private resizeTitleField(): void {
    this.ngZone.onStable.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.titleAutosize?.resizeToFitContent(true);
    });
  }

  private updateTitleValidation(isRequired: boolean): void {
    const titleControl = this.form.get('title');
    if (!titleControl) {
      return;
    }

    isRequired
      ? titleControl.setValidators(this.requiredTitleValidators)
      : titleControl.setValidators(this.baseTitleValidators);

    titleControl.updateValueAndValidity();
  }

  private buildForm(): void {
    const mode = this.store.selectSnapshot(TaskScreenState.mode);
    const existingTitle =
      mode === ETaskViewMode.Edit
        ? (this.store.selectSnapshot(TaskScreenState.task).title ?? '')
        : '';

    const existingDescription =
      mode === ETaskViewMode.Edit
        ? (this.store.selectSnapshot(TaskScreenState.task).description ?? null)
        : null;

    this.form = this.fb.group<FormControlsOf<ITaskEditFormData>>({
      title: this.fb.control(existingTitle, {
        validators: this.requiredTitleValidators,
        nonNullable: true,
      }),
      description: this.fb.control<TaskDescriptionDoc | null>(existingDescription),
    });
    this.titleLength = existingTitle.length;
  }
}
