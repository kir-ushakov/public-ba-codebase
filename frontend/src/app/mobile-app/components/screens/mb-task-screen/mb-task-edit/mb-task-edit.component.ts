import { Component, inject, output } from '@angular/core';
import { MbTaskScreenAction } from '../mb-task-screen.actions';
import { Store } from '@ngxs/store';
import { ReactiveFormsModule, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { MbTaskScreenState } from '../mb-task-screen.state';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'ba-mb-task-edit',
  imports: [ 
    CommonModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatIconModule,
    ReactiveFormsModule
  ],
  templateUrl: './mb-task-edit.component.html',
  styleUrl: './mb-task-edit.component.scss'
})
export class MbTaskEditComponent {
  formValidStatus = output<boolean>();
  imageUri$: Observable<string> = inject(Store).select(MbTaskScreenState.imageUri);

  MbTaskScreenState = MbTaskScreenState;
  
  constructor(
    private store: Store
  ) {}

  ngOnInit() {
    this.initSubscriptions();
  }

  form: UntypedFormGroup = new UntypedFormGroup({
    title: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(50),
    ]),
  });

  addPictureBtnPressed() {
    this.store.dispatch(MbTaskScreenAction.AddPictureBtnPressed);
  }

  private initSubscriptions() {
    this.form.valueChanges.subscribe(() => {
      this.store.dispatch(new MbTaskScreenAction.UpdateFormValidStatus(this.form.valid))
    });
  }
}
