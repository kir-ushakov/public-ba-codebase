import { Component, input } from '@angular/core';


export interface ITaskSideMenuOptionItem  {
  label: string;
  icon: string;
  callback: () => void
}

@Component({
  selector: 'ba-mb-task-side-menu-item',
  imports: [],
  templateUrl: './mb-task-side-menu-item.component.html',
  styleUrl: './mb-task-side-menu-item.component.scss'
})
export class MbTaskSideMenuItemComponent {
  optionItem = input.required<ITaskSideMenuOptionItem>();
}
