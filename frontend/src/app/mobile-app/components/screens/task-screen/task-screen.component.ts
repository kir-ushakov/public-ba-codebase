import {
  ChangeDetectorRef,
  Component,
  computed,
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

  mode = inject(Store).selectSignal(TaskScreenState.mode);
  headerTitle = computed(() => {
    switch (this.mode()) {
      case ETaskViewMode.Edit:
        return 'Edit Task';
      case ETaskViewMode.View:
        return 'Task';
      default:
        return 'Create Task';
    }
  });
  headerTitleTestId = computed(() => {
    switch (this.mode()) {
      case ETaskViewMode.Edit:
        return 'edit-task-title';
      case ETaskViewMode.View:
        return 'task-title';
      default:
        return 'create-task-title';
    }
  });
  headerBackTestId = computed(() => {
    switch (this.mode()) {
      case ETaskViewMode.Edit:
        return 'edit-task-back';
      case ETaskViewMode.View:
        return 'task-back';
      default:
        return 'create-task-back';
    }
  });
  showHeaderMenu = computed(() => this.mode() !== ETaskViewMode.Create);
  headerMenuLabel = computed(() =>
    this.mode() === ETaskViewMode.View ? 'Task options' : 'More options',
  );
  headerMenuTestId = computed(() =>
    this.mode() === ETaskViewMode.View ? 'task-options-btn' : 'edit-task-more',
  );
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

  goBack(): void {
    this.store.dispatch(TaskScreenAction.CancelButtonPressed);
  }

  toggleMenu(): void {
    this.store.dispatch(TaskScreenAction.SideMenuToggle);
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
