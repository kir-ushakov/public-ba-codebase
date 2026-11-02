import { Component, input, output } from '@angular/core';

export type TaskContentMode = 'description' | 'checklist';

@Component({
  selector: 'ba-task-content-switch',
  templateUrl: './task-content-switch.component.html',
  styleUrl: './task-content-switch.component.scss',
})
export class TaskContentSwitchComponent {
  readonly mode = input<TaskContentMode>('description');
  readonly descriptionHasContent = input(false);
  readonly checklistHasContent = input(false);
  readonly modeChange = output<TaskContentMode>();

  select(mode: TaskContentMode): void {
    this.modeChange.emit(mode);
  }
}
