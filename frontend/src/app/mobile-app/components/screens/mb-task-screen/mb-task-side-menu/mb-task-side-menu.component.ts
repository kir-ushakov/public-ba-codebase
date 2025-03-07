import { Component, output } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskScreenAction } from '../mb-task-screen.actions';

@Component({
  selector: 'ba-mb-task-side-menu',
  imports: [],
  templateUrl: './mb-task-side-menu.component.html',
  styleUrl: './mb-task-side-menu.component.scss'
})
export class MbTaskSideMenuComponent {
  toggleMenu = output<void>();

  constructor(
    private store: Store
  ) { } 

  editTaskOptionSelected() {
    this.store.dispatch(MbTaskScreenAction.EditTaskOptionSelected);
    this.toggleMenu.emit();
  }

  completeTask() {
    this.store.dispatch(MbTaskScreenAction.CompleteTaskOptionSelected);
  }

  canceledTask() {
    this.store.dispatch(MbTaskScreenAction.CancelTaskOptionSelected);
  }

  deleteTaskOptionSelected() {
    this.toggleMenu.emit();
    this.store.dispatch(MbTaskScreenAction.DeleteTaskOptionSelected);
  }
}
