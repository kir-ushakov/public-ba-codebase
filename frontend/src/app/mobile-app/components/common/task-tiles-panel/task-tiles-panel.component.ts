import { Component, Input } from '@angular/core';
import { Task } from 'src/app/shared/models/task.model';

@Component({
  selector: 'ba-task-tiles-panel',
  templateUrl: './task-tiles-panel.component.html',
  styleUrls: ['./task-tiles-panel.component.scss'],
})
export class TaskTilesPanelComponent {
  @Input() tasks: Array<Task>;
}
