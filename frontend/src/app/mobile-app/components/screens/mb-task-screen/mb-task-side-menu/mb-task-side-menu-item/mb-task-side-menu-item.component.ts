import { Component, input } from '@angular/core';
import { ITaskSideMenuOptionItem } from './mb-task-side-menu-item.interface';

@Component({
  selector: 'ba-mb-task-side-menu-item',
  imports: [],
  templateUrl: './mb-task-side-menu-item.component.html',
  styleUrl: './mb-task-side-menu-item.component.scss'
})
export class MbTaskSideMenuItemComponent {
  optionItem = input.required<ITaskSideMenuOptionItem>();
}
