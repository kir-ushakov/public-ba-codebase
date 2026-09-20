import { Component, inject, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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

  isEditFormValid$: Observable<boolean> = inject(Store).select(TaskScreenState.isEditFormValid);

  ETaskViewMode = ETaskViewMode;

  constructor(private store: Store) {}

  ngOnInit() {}

  cancelChanges(): void {
    this.store.dispatch(TaskScreenAction.CancelButtonPressed);
  }

  applyChanges(): void {
    this.store.dispatch(TaskScreenAction.ApplyButtonPressed);
  }

  goHome() {
    this.store.dispatch(TaskScreenAction.HomeButtonPressed);
  }
}
