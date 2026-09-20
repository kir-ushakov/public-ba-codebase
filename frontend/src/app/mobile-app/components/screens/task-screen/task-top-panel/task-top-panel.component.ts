import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { TaskScreenAction } from '../task-screen.actions';
import { Observable } from 'rxjs';
import { TaskScreenState } from '../task-screen.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ba-task-top-panel',
  imports: [CommonModule],
  templateUrl: './task-top-panel.component.html',
  styleUrl: './task-top-panel.component.scss',
})
export class TaskTopPanelComponent {
  showCompleteTaskBtn$: Observable<boolean> = inject(Store).select(
    TaskScreenState.showCompleteTaskBtn,
  );
  showToggleOptionsBtn$: Observable<boolean> = inject(Store).select(
    TaskScreenState.showToggleOptionsBtn,
  );

  constructor(private readonly store: Store) {}

  completeTask() {
    this.store.dispatch(TaskScreenAction.CompleteTaskOptionSelected);
  }

  toggleMenu() {
    this.store.dispatch(TaskScreenAction.SideMenuToggle);
  }
}
