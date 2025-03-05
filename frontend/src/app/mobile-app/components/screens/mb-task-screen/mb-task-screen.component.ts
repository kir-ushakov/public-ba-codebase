import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';

import { MbTaskScreenAction } from './mb-task-screen.actions';
import { Observable, Subject } from 'rxjs';
import { MbTaskScreenState, ETaskViewMode } from './mb-task-screen.state';
import { ActivatedRoute } from '@angular/router';
import { Task } from 'src/app/shared/models/task.model';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { NgxsFormPluginModule } from '@ngxs/form-plugin';
import { CommonModule } from '@angular/common';
import { MbTaskViewBottomComponent } from './mb-task-view-bottom/mb-task-view-bottom.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'ba-mb-task-screen',
    templateUrl: './mb-task-screen.component.html',
    styleUrls: ['./mb-task-screen.component.scss'],
    imports: [ 
      CommonModule, 
      MatSidenavModule,
      MbTaskViewBottomComponent,
      MatFormFieldModule, 
      MatInputModule,
      MatIconModule,
      NgxsFormPluginModule,
      ReactiveFormsModule
    ]
})
export class MbTaskScreenComponent implements OnInit, OnDestroy {
  @ViewChild('menuDrawer') menuDrawer: MatDrawer;
  @ViewChild('titleInput') set titleInput(titleInputElRef: ElementRef) {
    if (titleInputElRef) {
      const titleInput: HTMLInputElement = titleInputElRef.nativeElement;
      titleInput.focus();
      this.cdr.detectChanges();
    }
  }

  mode$: Observable<ETaskViewMode> = inject(Store).select(MbTaskScreenState.mode);
  task$: Observable<Task> = inject(Store).select(MbTaskScreenState.task);
  showCompleteTaskBtn$: Observable<boolean> = inject(Store).select(MbTaskScreenState.showCompleteTaskBtn);
  showToggleOptionsBtn$: Observable<boolean> = inject(Store).select(MbTaskScreenState.showToggleOptionsBtn);
  imageUri$: Observable<string> = inject(Store).select(MbTaskScreenState.imageUri);

  ETaskViewMode = ETaskViewMode;

  form: UntypedFormGroup = new UntypedFormGroup({
    title: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(50),
    ]),
  });

  MbTaskScreenState = MbTaskScreenState;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeToRouteParams();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  completeTask() {
    this.store.dispatch(MbTaskScreenAction.CompleteTaskOptionSelected);
  }

  canceledTask() {
    this.store.dispatch(MbTaskScreenAction.CancelTaskOptionSelected);
  }

  openTaksOptions() {
    this.store.dispatch(MbTaskScreenAction.OpenTaskOptions);
  }

  toggleMenu() {
    this.menuDrawer.toggle();
  }

  editTaskOptionSelected() {
    this.store.dispatch(MbTaskScreenAction.EditTaskOptionSelected);
    this.menuDrawer.toggle();
  }

  deleteTaskOptionSelected() {
    this.menuDrawer.toggle();
    this.store.dispatch(MbTaskScreenAction.DeleteTaskOptionSelected);
  }

  addPictureBtnPressed() {
    this.store.dispatch(MbTaskScreenAction.AddPictureBtnPressed);
  }

  private subscribeToRouteParams() {
    this.route.paramMap.subscribe((params) => {
      this.store.dispatch(
        new MbTaskScreenAction.Opened(
          <ETaskViewMode>params.get('mode'),
          params.get('id')
        )
      );
    });
  }
}
