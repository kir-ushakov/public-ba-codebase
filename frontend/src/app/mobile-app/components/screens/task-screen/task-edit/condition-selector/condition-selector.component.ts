import { ChangeDetectionStrategy, Component, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import type { ControlValueAccessor } from '@angular/forms';
import { ETaskCondition } from '@brainassistant/contracts';

type TaskConditionOption = {
  id: ETaskCondition;
  testId: 'todo' | 'calendar' | 'location';
  label: string;
  icon: string;
};

const TASK_CONDITIONS: TaskConditionOption[] = [
  {
    id: ETaskCondition.Todo,
    testId: 'todo',
    label: 'To do',
    icon: 'radio_button_unchecked',
  },
  {
    id: ETaskCondition.Calendar,
    testId: 'calendar',
    label: 'Calendar',
    icon: 'calendar_month',
  },
  {
    id: ETaskCondition.Location,
    testId: 'location',
    label: 'Location',
    icon: 'location_on',
  },
];

const CONDITION_ORDER = TASK_CONDITIONS.map(option => option.id);

@Component({
  selector: 'ba-condition-selector',
  templateUrl: './condition-selector.component.html',
  styleUrl: './condition-selector.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ConditionSelectorComponent),
      multi: true,
    },
  ],
})
export class ConditionSelectorComponent implements ControlValueAccessor {
  readonly options = TASK_CONDITIONS;
  readonly selected = signal<ETaskCondition[]>([ETaskCondition.Todo]);

  writeValue(value: ETaskCondition[] | null): void {
    if (!value?.length) {
      return;
    }
    this.selected.set(this.ordered(value));
  }

  registerOnChange(fn: (value: ETaskCondition[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  isSelected(condition: ETaskCondition): boolean {
    return this.selected().includes(condition);
  }

  toggle(condition: ETaskCondition): void {
    this.onTouched();
    const current = this.selected();
    const has = current.includes(condition);
    if (has && current.length === 1) {
      return;
    }
    const next = has ? current.filter(item => item !== condition) : [...current, condition];
    const ordered = this.ordered(next);
    this.selected.set(ordered);
    this.onChange(ordered);
  }

  private ordered(conditions: readonly ETaskCondition[]): ETaskCondition[] {
    return CONDITION_ORDER.filter(condition => conditions.includes(condition));
  }

  private onChange: (value: ETaskCondition[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;
}
