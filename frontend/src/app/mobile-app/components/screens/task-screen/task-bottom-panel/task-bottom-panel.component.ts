import { Component, computed, inject, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ETaskStatus, ETaskType } from '@brainassistant/contracts';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';
import { TaskScreenAction } from 'src/app/mobile-app/components/screens/task-screen/task-screen.actions';
import {
  ETaskViewMode,
  TaskScreenState,
} from 'src/app/mobile-app/components/screens/task-screen/task-screen.state';

@Component({
  selector: 'ba-task-bottom-panel',
  templateUrl: './task-bottom-panel.component.html',
  styleUrls: ['./task-bottom-panel.component.scss'],
  imports: [CommonModule],
})
export class TaskBottomPanelComponent {
  @Input() enabled!: boolean;

  mode: Signal<ETaskViewMode> = this.store.selectSignal(TaskScreenState.mode);
  readonly submitLabel = computed(() =>
    this.mode() === ETaskViewMode.Edit ? 'Save Changes' : 'Create Task',
  );
  readonly showMarkActive = computed(
    () =>
      this.mode() === ETaskViewMode.View &&
      this.task().type === ETaskType.Basic &&
      this.task().status === ETaskStatus.Todo,
  );
  readonly showMarkDone = computed(
    () => this.mode() === ETaskViewMode.View && this.task().status !== ETaskStatus.Done,
  );

  isEditFormValid$: Observable<boolean> = inject(Store).select(TaskScreenState.isEditFormValid);

  ETaskViewMode = ETaskViewMode;

  private readonly task = this.store.selectSignal(TaskScreenState.task);

  constructor(private store: Store) {}

  cancelChanges(): void {
    this.store.dispatch(TaskScreenAction.CancelButtonPressed);
  }

  applyChanges(): void {
    this.store.dispatch(TaskScreenAction.ApplyButtonPressed);
  }

  markActive(): void {
    this.store.dispatch(TaskScreenAction.MarkActiveButtonPressed);
  }

  markDone(): void {
    this.store.dispatch(TaskScreenAction.MarkDoneButtonPressed);
  }
}
