import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ETaskType } from '@brainassistant/contracts';
import {
  taskTypeIcon,
  taskTypeLabel,
} from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/task-type-icon.function';

@Component({
  selector: 'ba-task-type-chip',
  templateUrl: './task-type-chip.component.html',
  styleUrl: './task-type-chip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTypeChipComponent {
  readonly type = input.required<ETaskType>();
  readonly icon = computed(() => taskTypeIcon(this.type()));
  readonly label = computed(() => taskTypeLabel(this.type()));
}
