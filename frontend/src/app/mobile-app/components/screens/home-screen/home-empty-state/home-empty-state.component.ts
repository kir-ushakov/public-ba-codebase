import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { homeEmptyState } from '../helpers/home-empty-state.function';
import type { HomeContentMode } from '../helpers/home-content-mode.function';

@Component({
  selector: 'ba-home-empty-state',
  templateUrl: './home-empty-state.component.html',
  styleUrl: './home-empty-state.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeEmptyStateComponent {
  readonly mode = input.required<HomeContentMode>();
  readonly copy = computed(() => homeEmptyState(this.mode()));
}
