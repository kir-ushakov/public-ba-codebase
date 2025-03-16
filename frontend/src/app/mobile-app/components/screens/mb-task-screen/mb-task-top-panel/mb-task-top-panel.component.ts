import { Component, inject } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbTaskScreenAction } from '../mb-task-screen.actions';
import { Observable } from 'rxjs';
import { MbTaskScreenState } from '../mb-task-screen.state';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ba-mb-task-top-panel',
  imports: [ CommonModule ],
  templateUrl: './mb-task-top-panel.component.html',
  styleUrl: './mb-task-top-panel.component.scss'
})
export class MbTaskTopPanelComponent {
  showCompleteTaskBtn$: Observable<boolean> = inject(Store).select(MbTaskScreenState.showCompleteTaskBtn);
  showToggleOptionsBtn$: Observable<boolean> = inject(Store).select(MbTaskScreenState.showToggleOptionsBtn);

  constructor(private readonly store: Store) { }

  completeTask() {
    this.store.dispatch(MbTaskScreenAction.CompleteTaskOptionSelected);
  }

  toggleMenu() {
    this.store.dispatch(MbTaskScreenAction.SideMenuToggle);
  }
}
