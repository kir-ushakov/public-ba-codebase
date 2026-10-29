import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { HomeContentMode, HomeContentModeCounts } from '../helpers/home-content-mode.function';

type HomeContentModeOption = {
  id: HomeContentMode;
  label: string;
  icon: string;
  iconFill: 0 | 1;
};

const HOME_CONTENT_MODE_OPTIONS: HomeContentModeOption[] = [
  { id: 'active', label: 'Active', icon: 'play_arrow', iconFill: 1 },
  { id: 'todo', label: 'To do', icon: 'radio_button_unchecked', iconFill: 0 },
  { id: 'notes', label: 'Notes', icon: 'article', iconFill: 0 },
];

@Component({
  selector: 'ba-home-content-mode',
  templateUrl: './home-content-mode.component.html',
  styleUrl: './home-content-mode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeContentModeComponent {
  readonly selected = input.required<HomeContentMode>();
  readonly counts = input.required<HomeContentModeCounts>();
  readonly modeChange = output<HomeContentMode>();

  readonly options = HOME_CONTENT_MODE_OPTIONS;

  select(mode: HomeContentMode): void {
    if (this.selected() === mode) {
      return;
    }
    this.modeChange.emit(mode);
  }

  hasDivider(id: HomeContentMode): boolean {
    const index = this.options.findIndex(option => option.id === id);
    if (index <= 0) {
      return false;
    }
    const previous = this.options[index - 1]?.id;
    return previous !== undefined && this.selected() !== id && this.selected() !== previous;
  }
}
