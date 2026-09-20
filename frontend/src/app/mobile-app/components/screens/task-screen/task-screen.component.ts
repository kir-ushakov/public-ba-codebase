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
import { TaskScreenAction } from './task-screen.actions';
import { Observable, Subject } from 'rxjs';
import { TaskScreenState, ETaskViewMode } from './task-screen.state';
import { ActivatedRoute } from '@angular/router';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { TaskTopPanelComponent } from './task-top-panel/task-top-panel.component';
import { TaskEditComponent } from './task-edit/task-edit.component';
import { TaskViewComponent } from './task-view/task-view.component';
import { TaskSideMenuComponent } from './task-side-menu/task-side-menu.component';
import { TaskBottomPanelComponent } from 'src/app/mobile-app/components/screens/task-screen/task-bottom-panel/task-bottom-panel.component';

@Component({
  selector: 'ba-task-screen',
  templateUrl: './task-screen.component.html',
  styleUrls: ['./task-screen.component.scss'],
  imports: [
    CommonModule,
    MatSidenavModule,
    TaskBottomPanelComponent,
    TaskTopPanelComponent,
    TaskEditComponent,
    TaskViewComponent,
    TaskSideMenuComponent,
  ],
})
export class TaskScreenComponent implements OnInit, OnDestroy {
  @ViewChild('menuDrawer') menuDrawer!: MatDrawer;
  @ViewChild('titleInput') set titleInput(titleInputElRef: ElementRef) {
    if (titleInputElRef) {
      const titleInput: HTMLInputElement = titleInputElRef.nativeElement;
      titleInput.focus();
      this.cdr.detectChanges();
    }
  }

  mode$: Observable<ETaskViewMode> = inject(Store).select(TaskScreenState.mode);
  isSideMenuOpened$: Observable<boolean> = inject(Store).select(TaskScreenState.isSideMenuOpened);

  ETaskViewMode = ETaskViewMode;

  private destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscribeToRouteParams();
    this.subscribeToSelectors();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.complete();
  }

  private subscribeToRouteParams() {
    this.route.paramMap.subscribe(params => {
      this.store.dispatch(
        new TaskScreenAction.Opened(<ETaskViewMode>params.get('mode'), params.get('id')),
      );
    });
  }

  private subscribeToSelectors() {
    this.isSideMenuOpened$.subscribe(isSideMenuOpened => this.menuDrawer?.toggle(isSideMenuOpened));
  }
}
