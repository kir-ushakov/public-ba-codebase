import { Component, inject, output } from '@angular/core';
import { MbTaskScreenAction } from '../mb-task-screen.actions';
import { Store } from '@ngxs/store';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { IEditTaskFormData, MbTaskScreenState } from '../mb-task-screen.state';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SpeechRecorderComponent } from 'src/app/shared/components/ui-elements/speech-recorder/speech-recorder.component';
import { DialogService } from 'src/app/shared/services/utility/dialog.service';
import { FormControlsOf } from 'src/app/shared/forms/types/form-controls-of';

@Component({
  selector: 'ba-mb-task-edit',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule,
    SpeechRecorderComponent,
  ],
  templateUrl: './mb-task-edit.component.html',
  styleUrl: './mb-task-edit.component.scss',
})
export class MbTaskEditComponent {
  formValidStatus = output<boolean>();
  imageUri$: Observable<string> = inject(Store).select(MbTaskScreenState.imageUri);

  MbTaskScreenState = MbTaskScreenState;

  private readonly baseTitleValidators = [Validators.minLength(5), Validators.maxLength(50)];
  private readonly requiredTitleValidators = [Validators.required, ...this.baseTitleValidators];

  constructor(
    private store: Store,
    private dialogService: DialogService,
    private fb: FormBuilder,
  ) {}

  ngOnInit() {
    this.initSubscriptions();
  }

  form = this.fb.group<FormControlsOf<IEditTaskFormData>>({
    title: this.fb.control('', {
      validators: this.requiredTitleValidators,
      nonNullable: true,
    }),
  });

  addPictureBtnPressed() {
    this.store.dispatch(MbTaskScreenAction.AddPictureBtnPressed);
  }

  onMicClick() {
    this.dialogService.showFullScreenDialog(SpeechRecorderComponent);
  }

  private initSubscriptions() {
    this.form.valueChanges.subscribe(() => {
      this.store.dispatch(new MbTaskScreenAction.UpdateForm(this.form.valid, this.form.value));
    });

    this.imageUri$.subscribe(imageUri => {
      const isPictureAdded = !!imageUri;
      this.updateTitleValidation(!isPictureAdded);
    });
  }

  private updateTitleValidation(isRequired: boolean) {
    const titleControl = this.form.get('title');

    if (titleControl) {
      if (isRequired) {
        titleControl.setValidators(this.requiredTitleValidators);
      } else {
        titleControl.setValidators(this.baseTitleValidators);
      }
      titleControl.updateValueAndValidity();
    }
  }
}
