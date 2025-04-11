import { Component, inject, Input, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Store } from '@ngxs/store';
import { MbTaskScreenAction } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.actions';
import { ETaskViewMode, MbTaskScreenState } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';

@Component({
    selector: 'ba-mb-task-bottom-panel',
    templateUrl: './mb-task-bottom-panel.html',
    styleUrls: ['./mb-task-bottom-panel.component.scss'],
    imports: [ CommonModule ]
})
export class MbTaskBottomPanelComponent {
  @Input() enabled: boolean;

  mode: Signal<ETaskViewMode> = this.store.selectSignal(MbTaskScreenState.mode);

  isEditFormValid$: Observable<boolean> = inject(Store).select(MbTaskScreenState.isEditFormValid);

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
