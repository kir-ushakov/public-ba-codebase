import { Component, Input, HostListener } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskTileAction } from './task-tile.actions';
import { Task } from 'src/app/shared/models/task.model';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'ba-task-tile',
    templateUrl: './task-tile.component.html',
    styleUrls: ['./task-tile.component.scss'],
    imports: [ CommonModule ]
})
export class TaskTileComponent {
  @Input() task: Task;
  @HostListener('click') onClick() {
    this.store.dispatch(new MbTaskTileAction.Clicked(this.task.id));
  }

  constructor(private store: Store) {}
}
