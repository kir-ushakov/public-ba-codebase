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
import { ETaskStatus } from 'src/app/shared/models/task.model';
import { confirmActiveToNote } from 'src/app/shared/helpers/task-status-conversion.function';

function isNote(status: ETaskStatus | undefined): boolean {
  return status === ETaskStatus.Notes;
}

function optionsMenuFor(status: ETaskStatus | undefined): ContextMenuItem[] {
  const note = isNote(status);
  return [
    {
      id: 'edit',
      label: note ? 'Edit' : 'Edit task',
      icon: 'edit',
      testId: 'task-menu-edit',
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'content_copy',
      testId: 'task-menu-duplicate',
      disabled: true,
    },
    {
      id: 'convert',
      label: note ? 'Convert to task' : 'Convert to note',
      icon: 'swap_horiz',
      testId: 'task-menu-convert',
    },
    {
      id: 'delete',
      label: note ? 'Delete' : 'Delete task',
      icon: 'delete',
      testId: 'task-menu-delete',
      danger: true,
      separatorBefore: true,
    },
  ];
}

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
    const note = isNote(this.task().status);
    switch (this.mode()) {
      case ETaskViewMode.Edit:
        return note ? 'Edit Note' : 'Edit Task';
      case ETaskViewMode.View:
        return note ? 'Note' : 'Task';
      default:
        return note ? 'Create Note' : 'Create Task';
    }
  });
  headerTitleTestId = computed(() => {
    const note = isNote(this.task().status);
    switch (this.mode()) {
      case ETaskViewMode.Edit:
        return note ? 'edit-note-title' : 'edit-task-title';
      case ETaskViewMode.View:
        return note ? 'note-title' : 'task-title';
      default:
        return note ? 'create-note-title' : 'create-task-title';
    }
  });
  headerBackTestId = computed(() => {
    const note = isNote(this.task().status);
    switch (this.mode()) {
      case ETaskViewMode.Edit:
        return note ? 'edit-note-back' : 'edit-task-back';
      case ETaskViewMode.View:
        return note ? 'note-back' : 'task-back';
      default:
        return note ? 'create-note-back' : 'create-task-back';
    }
  });
  showHeaderMenu = computed(() => this.mode() !== ETaskViewMode.Create);
  headerMenuLabel = computed(() => {
    if (this.mode() !== ETaskViewMode.View) {
      return 'More options';
    }
    return isNote(this.task().status) ? 'Note options' : 'Task options';
  });
  headerMenuTestId = computed(() =>
    this.mode() === ETaskViewMode.View ? 'task-options-btn' : 'edit-task-more',
  );
  readonly isOptionsMenuOpen = signal(false);
  readonly optionsMenuItems = computed(() => optionsMenuFor(this.task().status));

  ETaskViewMode = ETaskViewMode;

  private readonly task = inject(Store).selectSignal(TaskScreenState.task);

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
      return;
    }
    if (id === 'convert') {
      const status = this.store.selectSnapshot(TaskScreenState.task).status;
      if (!confirmActiveToNote(status)) {
        return;
      }
      this.store.dispatch(TaskScreenAction.ConvertOptionSelected);
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
