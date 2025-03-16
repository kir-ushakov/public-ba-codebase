import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { Select, Store } from '@ngxs/store';
import { MbTaskScreenAction } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.actions';
import { ETaskViewMode, MbTaskScreenState } from 'src/app/mobile-app/components/screens/mb-task-screen/mb-task-screen.state';

@Component({
    selector: 'ba-bottom-panel',
    templateUrl: './bottom-panel.component.html',
    styleUrls: ['./bottom-panel.component.scss'],
    imports: [ CommonModule ]
})
export class BottomPanelComponent {
  @Input() enabled: boolean;
  @Select(MbTaskScreenState.mode)
  mode$: Observable<ETaskViewMode>;

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
