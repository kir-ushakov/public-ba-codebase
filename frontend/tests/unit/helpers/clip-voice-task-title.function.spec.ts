import { TaskConst } from '@brainassistant/contracts';
import { clipVoiceTaskTitle } from 'src/app/mobile-app/components/screens/task-screen/task-edit/helpers/clip-voice-task-title.function';

describe('clipVoiceTaskTitle', () => {
  it('leaves a title of the max length or fewer unchanged', () => {
    const shortTitle = 'Buy milk';
    const exactMax = 'a'.repeat(TaskConst.TITLE_MAX_LENGTH);

    expect(clipVoiceTaskTitle(shortTitle)).toBe(shortTitle);
    expect(clipVoiceTaskTitle(exactMax)).toBe(exactMax);
  });

  it('clips a title longer than the max to 97 characters plus an ellipsis', () => {
    const longTitle = 'a'.repeat(TaskConst.TITLE_MAX_LENGTH + 1);
    const clipped = clipVoiceTaskTitle(longTitle);

    expect(clipped).toBe(`${'a'.repeat(TaskConst.TITLE_MAX_LENGTH - 3)}...`);
    expect(clipped.length).toBe(TaskConst.TITLE_MAX_LENGTH);
  });
});
