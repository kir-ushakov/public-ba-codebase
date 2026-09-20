import { Component, input } from '@angular/core';
import { ITaskSideMenuOptionItem } from './task-side-menu-item.interface';

@Component({
  selector: 'ba-task-side-menu-item',
  imports: [],
  templateUrl: './task-side-menu-item.component.html',
  styleUrl: './task-side-menu-item.component.scss',
})
export class TaskSideMenuItemComponent {
  optionItem = input.required<ITaskSideMenuOptionItem>();
}
