import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { Store } from '@ngxs/store';
import { TaskScreenAction } from './task-screen.actions';
import { TaskScreenState, ETaskViewMode } from './task-screen.state';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';
import { TaskEditComponent } from './task-edit/task-edit.component';
import { TaskViewComponent } from './task-view/task-view.component';
import { TaskBottomPanelComponent } from 'src/app/mobile-app/components/screens/task-screen/task-bottom-panel/task-bottom-panel.component';

const optionsMenuItems: ContextMenuItem[] = [
  { id: 'edit', label: 'Edit task', icon: 'edit', testId: 'task-menu-edit' },
  {
    id: 'duplicate',
    label: 'Duplicate',
    icon: 'content_copy',
    testId: 'task-menu-duplicate',
    disabled: true,
  },
  {
    id: 'delete',
    label: 'Delete task',
    icon: 'delete',
    testId: 'task-menu-delete',
    danger: true,
    separatorBefore: true,
  },
];

@Component({
  selector: 'ba-task-screen',
  templateUrl: './task-screen.component.html',
  styleUrls: ['./task-screen.component.scss'],
  imports: [
    CommonModule,
    ContextMenuComponent,
    TaskBottomPanelComponent,
    TaskEditComponent,
    TaskViewComponent,
  ],
})
export class TaskScreenComponent implements OnInit {
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
  readonly isOptionsMenuOpen = signal(false);
  readonly optionsMenuItems = optionsMenuItems;

  ETaskViewMode = ETaskViewMode;

  constructor(
    private store: Store,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.subscribeToRouteParams();
  }

  goBack(): void {
    this.store.dispatch(TaskScreenAction.CancelButtonPressed);
  }

  toggleMenu(): void {
    this.isOptionsMenuOpen.update(isOpen => !isOpen);
  }

  closeMenu(): void {
    this.isOptionsMenuOpen.set(false);
  }

  onOptionsMenuItem(id: string): void {
    this.closeMenu();
    if (id === 'edit') {
      this.store.dispatch(TaskScreenAction.EditTaskOptionSelected);
      return;
    }
    if (id === 'delete') {
      this.store.dispatch(TaskScreenAction.DeleteTaskOptionSelected);
    }
  }

  private subscribeToRouteParams(): void {
    this.route.paramMap.subscribe(params => {
      this.store.dispatch(
        new TaskScreenAction.Opened(<ETaskViewMode>params.get('mode'), params.get('id')),
      );
    });
  }
}
