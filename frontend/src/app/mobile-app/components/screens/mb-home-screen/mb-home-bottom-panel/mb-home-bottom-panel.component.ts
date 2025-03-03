import { Component } from '@angular/core';
import { Store } from '@ngxs/store';
import { MbHomeBottomPanelAction } from './mb-home-bottom-panel.actions';

@Component({
    selector: 'ba-mb-home-bottom-panel',
    templateUrl: './mb-home-bottom-panel.component.html',
    styleUrls: ['./mb-home-bottom-panel.component.scss'],
})
export class MbHomeBottomPanelComponent {
  constructor(private store: Store) {}

  createTask() {
    this.store.dispatch(MbHomeBottomPanelAction.CreateTask);
  }
}
