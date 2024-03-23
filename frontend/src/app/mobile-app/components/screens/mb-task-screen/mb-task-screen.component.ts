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
import { MatDrawer } from '@angular/material/sidenav';
import {
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'ba-mb-task-screen',
  templateUrl: './mb-task-screen.component.html',
  styleUrls: ['./mb-task-screen.component.scss'],
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

  @Select(MbTaskScreenState.mode) mode$: Observable<ETaskViewMode>;
  @Select(MbTaskScreenState.task) taks$: Observable<Task>;
  @Select(MbTaskScreenState.showCompleteTaskBtn)
  showCompleteTaskBtn$: Observable<boolean>;
  @Select(MbTaskScreenState.showToggleOptionsBtn)
  showToggleOptionsBtn$: Observable<boolean>;

  ETaskViewMode = ETaskViewMode;

  form: UntypedFormGroup = new UntypedFormGroup({
    title: new UntypedFormControl('', [
      Validators.required,
      Validators.minLength(5),
      Validators.maxLength(50),
    ]),
  });

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
    this.menuDrawer.toggle();
    this.store.dispatch(MbTaskScreenAction.EditTaskOptionSelected);
  }

  deleteTaskOptionSelected() {
    this.menuDrawer.toggle();
    this.store.dispatch(MbTaskScreenAction.DeleteTaskOptionSelected);
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
