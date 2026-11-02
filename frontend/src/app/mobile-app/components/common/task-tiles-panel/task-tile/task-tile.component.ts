import { Component, DestroyRef, HostListener, inject, Input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngxs/store';
import { firstValueFrom } from 'rxjs';
import { TaskTileAction } from './task-tile.actions';
import { ETaskViewMode } from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';
import { ETaskStatus, Task } from 'src/app/shared/models/task.model';
import { ContextMenuComponent } from 'src/app/shared/components/ui-elements/context-menu/context-menu.component';
import type { ContextMenuItem } from 'src/app/shared/components/ui-elements/context-menu/context-menu-item.type';
import { SpinnerComponent } from 'src/app/shared/components/ui-elements/spinner/spinner.component';
import { TASK_TILE_DATE_LOCALE } from './helpers/format-task-tile-date.function';
import { TaskTileCalendar } from './task-tile-calendar.service';
import { TaskTileDatePipe } from './task-tile-date.pipe';
import { TaskTileImagePipe } from './task-tile-image.pipe';
import { taskTypeIcon } from './helpers/task-type-icon.function';
import { shouldOfferChecklistCompletionOnNoteConversion } from 'src/app/shared/helpers/checklist.function';
import {
  confirmActiveToNote,
  statusAfterConversion,
} from 'src/app/shared/helpers/task-status-conversion.function';
import { ChecklistCompletionPromptService } from 'src/app/shared/services/application/checklist-completion-prompt.service';

function menuItemsFor(status: ETaskStatus): ContextMenuItem[] {
  const note = status === ETaskStatus.Notes;
  return [
    { id: 'edit', label: 'Edit', icon: 'edit', testId: 'task-tile-menu-edit' },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: 'content_copy',
      testId: 'task-tile-menu-duplicate',
      disabled: true,
    },
    {
      id: 'add-to-tags',
      label: 'Add to tags',
      icon: 'sell',
      testId: 'task-tile-menu-add-to-tags',
      disabled: true,
    },
    {
      id: 'convert',
      label: note ? 'Convert to task' : 'Convert to note',
      icon: 'swap_horiz',
      testId: 'task-tile-menu-convert',
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      testId: 'task-tile-menu-delete',
      danger: true,
      separatorBefore: true,
    },
  ];
}

@Component({
  selector: 'ba-task-tile',
  templateUrl: './task-tile.component.html',
  styleUrls: ['./task-tile.component.scss'],
  imports: [ContextMenuComponent, SpinnerComponent, TaskTileDatePipe, TaskTileImagePipe],
  host: {
    '[class.is-menu-open]': 'isMenuOpen()',
  },
})
export class TaskTileComponent {
  @Input() task!: Task;
  @HostListener('click') onClick() {
    if (this.isMenuOpen()) {
      return;
    }
    void this.router.navigate([`task/${ETaskViewMode.View}/${this.task.id}`]);
  }

  isLoading = signal(true);
  readonly isMenuOpen = signal(false);
  readonly dateLocale = TASK_TILE_DATE_LOCALE;

  private readonly calendar = inject(TaskTileCalendar);
  private readonly checklistPrompts = inject(ChecklistCompletionPromptService);
  readonly dayKey = this.calendar.dayKey;

  constructor(
    private store: Store,
    private router: Router,
  ) {
    this.calendar.retain();
    inject(DestroyRef).onDestroy(() => this.calendar.release());
  }

  get typeIcon(): string {
    if (this.task.status === ETaskStatus.Notes) {
      return 'article';
    }
    return taskTypeIcon(this.task.type);
  }

  get menuItems(): ContextMenuItem[] {
    return menuItemsFor(this.task.status);
  }

  onMoreClick(event: Event): void {
    event.stopPropagation();
    this.isMenuOpen.update(isOpen => !isOpen);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  onMenuItem(id: string): void {
    this.closeMenu();
    if (id === 'edit') {
      void this.router.navigate([`task/${ETaskViewMode.Edit}/${this.task.id}`]);
      return;
    }
    if (id === 'delete') {
      this.store.dispatch(new TaskTileAction.DeleteSelected(this.task.id));
      return;
    }
    if (id === 'convert') {
      void this.convertSelected();
    }
  }

  private async convertSelected(): Promise<void> {
    if (!confirmActiveToNote(this.task.status)) {
      return;
    }
    const from = this.task.status;
    const to = statusAfterConversion(from);
    const checklist = this.task.checklist;
    const taskId = this.task.id;
    await firstValueFrom(this.store.dispatch(new TaskTileAction.ConvertSelected(taskId, to)));
    if (
      to === ETaskStatus.Todo &&
      shouldOfferChecklistCompletionOnNoteConversion(from, to, checklist)
    ) {
      this.checklistPrompts.offer({ taskId, status: ETaskStatus.Todo });
    }
  }

  onImageError(): void {
    this.isLoading.set(false);
  }
}
