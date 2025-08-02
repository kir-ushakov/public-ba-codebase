import { Component, DestroyRef, inject, output } from '@angular/core';
import { MbTaskScreenAction } from '../mb-task-screen.actions';
import { Actions, ofActionDispatched, Store } from '@ngxs/store';
import type { FormGroup } from '@angular/forms';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs';
import type { Observable } from 'rxjs';
import { MbTaskScreenState } from '../mb-task-screen.state';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { VoiceRecorderComponent } from 'src/app/shared/components/ui-elements/speech-recorder/voice-recorder.component';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import type { FormControlsOf } from 'src/app/shared/forms/types/form-controls-of';
import type { ITaskEditFormData } from './mb-task-edit.component.interface';
import { ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'ba-mb-task-edit',
  imports: [CommonModule, MatFormFieldModule, MatInputModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './mb-task-edit.component.html',
  styleUrl: './mb-task-edit.component.scss',
})
export class MbTaskEditComponent {
  formValidStatus = output<boolean>();
  imageUri$: Observable<string> = inject(Store).select(MbTaskScreenState.imageUri);
  voiceToTextConverting$: Observable<boolean> = inject(Store).select(
    MbTaskScreenState.voiceToTextConverting,
  );
  form: FormGroup<FormControlsOf<ITaskEditFormData>>;

  MbTaskScreenState = MbTaskScreenState;

  @ViewChild('titleInput') titleInput!: ElementRef<HTMLInputElement>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly store = inject(Store);
  private readonly dialogService = inject(DialogService);
  private readonly fb = inject(FormBuilder);
  private readonly actions$ = inject(Actions);

  private readonly baseTitleValidators = [Validators.minLength(5), Validators.maxLength(50)];
  private readonly requiredTitleValidators = [Validators.required, ...this.baseTitleValidators];

  ngOnInit(): void {
    this.buildForm();
    this.initSubscriptions();
  }

  addPictureBtnPressed(): void {
    this.store.dispatch(MbTaskScreenAction.AddPictureBtnPressed);
  }

  onMicClick(): void {
    // Blur the input to prevent virtual keyboard
    this.titleInput.nativeElement.blur();

    const dialogRef = this.dialogService.showFullScreenDialog(VoiceRecorderComponent);

    const recorder = dialogRef.componentInstance as VoiceRecorderComponent;

    if (recorder) {
      recorder.started.subscribe(() => {
        this.store.dispatch(MbTaskScreenAction.StartVoiceRecording);
      });
      recorder.stopped.subscribe(() => {
        this.store.dispatch(MbTaskScreenAction.StopVoiceRecording);
      });
      recorder.canceled.subscribe(() => {
        this.store.dispatch(MbTaskScreenAction.CancelVoiceRecording);
      });

      this.actions$
        .pipe(
          ofActionDispatched(MbTaskScreenAction.StopVoiceRecording),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.form.controls.title.setValue('');
        });
    }
  }

  private initSubscriptions(): void {
    this.form.valueChanges
      .pipe(debounceTime(300), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.store.dispatch(
          new MbTaskScreenAction.UpdateFormData(this.form.valid, this.form.value),
        );
      });

    this.imageUri$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(imageUri => {
      const isPictureAdded = Boolean(imageUri);
      this.updateTitleValidation(!isPictureAdded);
    });

    this.actions$
      .pipe(
        ofActionDispatched(MbTaskScreenAction.VoiceConvertedToTextSuccessful),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((payload: { text: string }) => {
        this.form.controls.title.setValue(payload.text);
      });
  }

  private updateTitleValidation(isRequired: boolean): void {
    const titleControl = this.form.get('title');

    isRequired
      ? titleControl.setValidators(this.requiredTitleValidators)
      : titleControl.setValidators(this.baseTitleValidators);

    titleControl.updateValueAndValidity();
  }

  private buildForm(): void {
    this.form = this.fb.group<FormControlsOf<ITaskEditFormData>>({
      title: this.fb.control('', {
        validators: this.requiredTitleValidators,
        nonNullable: true,
      }),
    });
  }
}
