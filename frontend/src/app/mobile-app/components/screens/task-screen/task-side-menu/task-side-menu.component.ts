import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { TaskScreenAction } from '../task-screen.actions';
import { TaskSideMenuItemComponent } from './task-side-menu-item/task-side-menu-item.component';
import { ITaskSideMenuOptionItem } from './task-side-menu-item/task-side-menu-item.interface';

@Component({
  selector: 'ba-task-side-menu',
  imports: [TaskSideMenuItemComponent],
  templateUrl: './task-side-menu.component.html',
  styleUrl: './task-side-menu.component.scss',
})
export class TaskSideMenuComponent {
  optionItems: ITaskSideMenuOptionItem[] = [
    {
      label: 'Edit',
      icon: 'assets/ui/icons/edit.png',
      callback: () => this.editTaskOptionSelected(),
    },
    {
      label: 'Done',
      icon: 'assets/ui/icons/checkmark-green.png',
      callback: () => this.completeTask(),
    },
    {
      label: 'Cancel',
      icon: 'assets/ui/icons/cancel-cross-icon-gray.png',
      callback: () => this.canceledTask(),
    },
    {
      label: 'Delete',
      icon: 'assets/ui/icons/rubbish.png',
      callback: () => this.deleteTaskOptionSelected(),
    },
  ];

  constructor(private store: Store) {}

  editTaskOptionSelected() {
    this.store.dispatch(TaskScreenAction.EditTaskOptionSelected);
    this.store.dispatch(TaskScreenAction.SideMenuToggle);
  }

  completeTask() {
    this.store.dispatch(TaskScreenAction.CompleteTaskOptionSelected);
  }

  canceledTask() {
    this.store.dispatch(TaskScreenAction.CancelTaskOptionSelected);
  }

  deleteTaskOptionSelected() {
    this.store.dispatch(TaskScreenAction.SideMenuToggle);
    this.store.dispatch(TaskScreenAction.DeleteTaskOptionSelected);
  }
}
