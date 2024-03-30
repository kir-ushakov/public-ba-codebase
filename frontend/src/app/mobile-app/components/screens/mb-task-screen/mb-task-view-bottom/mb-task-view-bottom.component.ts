import { Component, Input } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { MbTaskScreenState, ETaskViewMode } from '../mb-task-screen.state';
import { Observable } from 'rxjs';
import { MbTaskScreenAction } from '../mb-task-screen.actions';

@Component({
  selector: 'app-mb-task-view-bottom',
  templateUrl: './mb-task-view-bottom.component.html',
  styleUrls: ['./mb-task-view-bottom.component.scss'],
})
export class MbTaskViewBottomComponent {
  @Input() enabled: boolean;
  @Select(MbTaskScreenState.mode)
  mode$: Observable<ETaskViewMode>;

  ETaskViewMode = ETaskViewMode;

  constructor(private store: Store) {}

  ngOnInit() {}

  cancelChanges(): void {
    this.store.dispatch(MbTaskScreenAction.CancelButtonPressed);
  }

  applyChanges(): void {
    this.store.dispatch(MbTaskScreenAction.ApplyButtonPressed);
  }

  goHome() {
    this.store.dispatch(MbTaskScreenAction.HomeButtonPressed);
  }
}
