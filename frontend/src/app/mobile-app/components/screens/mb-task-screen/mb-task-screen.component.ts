import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';

import { MbTaskScreenAction } from './mb-task-screen.actions';
import { Observable, Subject } from 'rxjs';
import { MbTaskScreenState, ETaskViewMode } from './mb-task-screen.state';
import { ActivatedRoute } from '@angular/router';
import { Task } from 'src/app/shared/models/task.model';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { MbTaskViewBottomComponent } from './mb-task-view-bottom/mb-task-view-bottom.component';
import { MbTaskTopPanelComponent } from './mb-task-top-panel/mb-task-top-panel.component';
import { MbTaskEditComponent } from './mb-task-edit/mb-task-edit.component';

@Component({
    selector: 'ba-mb-task-screen',
    templateUrl: './mb-task-screen.component.html',
    styleUrls: ['./mb-task-screen.component.scss'],
    imports: [ 
      CommonModule, 
      MatSidenavModule,
      MbTaskViewBottomComponent,
      MbTaskTopPanelComponent,
      MbTaskEditComponent
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

  ETaskViewMode = ETaskViewMode;

  formValidStatus: boolean;

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
