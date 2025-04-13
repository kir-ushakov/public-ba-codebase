import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { MbTaskScreenState } from '../mb-task-screen.state';
import { Task } from 'src/app/shared/models/task.model';

@Component({
  selector: 'ba-mb-task-view',
  imports: [CommonModule],
  templateUrl: './mb-task-view.component.html',
  styleUrl: './mb-task-view.component.scss',
})
export class MbTaskViewComponent {
  task$: Observable<Task> = inject(Store).select(MbTaskScreenState.task);
}
