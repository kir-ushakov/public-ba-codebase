import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskScreenAction } from '../mb-task-screen.actions';
import { MbTaskSideMenuItemComponent } from './mb-task-side-menu-item/mb-task-side-menu-item.component';
import { ITaskSideMenuOptionItem } from './mb-task-side-menu-item/mb-task-side-menu-item.interface';

@Component({
  selector: 'ba-mb-task-side-menu',
  imports: [ MbTaskSideMenuItemComponent ],
  templateUrl: './mb-task-side-menu.component.html',
  styleUrl: './mb-task-side-menu.component.scss'
})
export class MbTaskSideMenuComponent {

  optionItems: ITaskSideMenuOptionItem[] = [
    {
      label: 'Edit',
      icon: 'assets/ui/icons/edit.png',
      callback: () => this.editTaskOptionSelected()
    },
    {
      label: 'Done',
      icon: 'assets/ui/icons/checkmark-green.png',
      callback: () => this.completeTask()
    },
    {
      label: 'Cancel',
      icon: 'assets/ui/icons/cancel-cross-icon-gray.png',
      callback: () => this.canceledTask()
    },
    {
      label: 'Delete',
      icon: 'assets/ui/icons/rubbish.png',
      callback: () => this.deleteTaskOptionSelected()
    },
  ];

  constructor(
    private store: Store
  ) { } 

  editTaskOptionSelected() {
    this.store.dispatch(MbTaskScreenAction.EditTaskOptionSelected);
    this.store.dispatch(MbTaskScreenAction.SideMenuToggle);
  }

  completeTask() {
    this.store.dispatch(MbTaskScreenAction.CompleteTaskOptionSelected);
  }

  canceledTask() {
    this.store.dispatch(MbTaskScreenAction.CancelTaskOptionSelected);
  }

  deleteTaskOptionSelected() {
    this.store.dispatch(MbTaskScreenAction.SideMenuToggle);
    this.store.dispatch(MbTaskScreenAction.DeleteTaskOptionSelected);
  }
}
