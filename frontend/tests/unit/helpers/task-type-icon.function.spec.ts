import { ETaskType } from '@brainassistant/contracts';
import { taskTypeIcon } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/task-type-icon.function';

describe('taskTypeIcon', () => {
  it('maps the basic task type to the To do icon', () => {
    expect(taskTypeIcon(ETaskType.Basic)).toBe('radio_button_unchecked');
  });

  it('maps location and calendar', () => {
    expect(taskTypeIcon(ETaskType.Location)).toBe('location_on');
    expect(taskTypeIcon(ETaskType.Calendar)).toBe('calendar_month');
  });
});
