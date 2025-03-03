import { Component, Input } from '@angular/core';
import { Task } from 'src/app/shared/models/task.model';
import { TaskTileComponent } from './task-tile/task-tile.component';

@Component({
    selector: 'ba-task-tiles-panel',
    templateUrl: './task-tiles-panel.component.html',
    styleUrls: ['./task-tiles-panel.component.scss'],
    imports: [ TaskTileComponent ]
})
export class TaskTilesPanelComponent {
  @Input() set tasks(tasks: Array<Task>) {
    this.columns = [];

    for (let k = 0; k < this.noOfColumns; k++) {
      const column: { index: number; tasks: Task[] } = {
        index: k + 1,
        tasks: [],
      };
      for (let i = k; i < tasks.length; i += this.noOfColumns) {
        column.tasks.push(tasks[i]);
      }
      console.log('K: ' + k);
      this.columns = [...this.columns, column];
    }
  }

  readonly noOfColumns = 3;

  columns: { index: number; tasks: Task[] }[] = [];
}
