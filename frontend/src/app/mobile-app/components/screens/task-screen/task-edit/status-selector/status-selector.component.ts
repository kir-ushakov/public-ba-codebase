import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { ETaskStatus } from '@brainassistant/contracts';

type TaskStatusOption = {
  id: ETaskStatus;
  testId: 'todo' | 'active';
  label: string;
  icon: string;
};

const TASK_FORM_STATUSES: TaskStatusOption[] = [
  {
    id: ETaskStatus.Todo,
    testId: 'todo',
    label: 'To do',
    icon: 'radio_button_unchecked',
  },
  {
    id: ETaskStatus.Active,
    testId: 'active',
    label: 'Active',
    icon: 'play_arrow',
  },
];

@Component({
  selector: 'ba-status-selector',
  templateUrl: './status-selector.component.html',
  styleUrl: './status-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => StatusSelectorComponent),
      multi: true,
    },
  ],
})
export class StatusSelectorComponent implements ControlValueAccessor {
  readonly options = TASK_FORM_STATUSES;
  readonly selected = signal<ETaskStatus>(ETaskStatus.Todo);

  writeValue(value: ETaskStatus | null): void {
    if (value === null) {
      return;
    }
    this.selected.set(value);
  }

  registerOnChange(fn: (value: ETaskStatus) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  select(status: ETaskStatus): void {
    this.onTouched();
    if (this.selected() === status) {
      return;
    }
    this.selected.set(status);
    this.onChange(status);
  }

  private onChange: (value: ETaskStatus) => void = () => undefined;
  private onTouched: () => void = () => undefined;
}
