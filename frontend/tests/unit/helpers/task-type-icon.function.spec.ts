import { ETaskType } from '@brainassistant/contracts';
import { taskTypeIcon } from 'src/app/mobile-app/components/common/task-tiles-panel/task-tile/helpers/task-type-icon.function';

describe('taskTypeIcon', () => {
  it('maps the basic task type to radio_button_unchecked', () => {
    expect(taskTypeIcon(ETaskType.Basic)).toBe('radio_button_unchecked');
  });
});
