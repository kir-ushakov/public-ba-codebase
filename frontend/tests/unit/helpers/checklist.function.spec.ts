import { ETaskStatus } from '@brainassistant/contracts';
import {
  checklistKeepLabel,
  isChecklistComplete,
  moveChecklistItem,
  shouldOfferChecklistCompletion,
  shouldOfferChecklistCompletionOnNoteConversion,
} from 'src/app/shared/helpers/checklist.function';

const openItem = { id: 'a', text: 'Buy cat food', completed: false };
const doneItem = { id: 'b', text: 'Check salmon variant', completed: true };

describe('checklist completion rules', () => {
  it('treats a missing or empty checklist as incomplete', () => {
    expect(isChecklistComplete(undefined)).toBe(false);
    expect(isChecklistComplete([])).toBe(false);
    expect(shouldOfferChecklistCompletion(ETaskStatus.Todo, undefined, [])).toBe(false);
    expect(shouldOfferChecklistCompletion(ETaskStatus.Todo, [], [])).toBe(false);
  });

  it('offers completion only on the transition to a full list for to-do and active', () => {
    const complete = [doneItem, { ...openItem, completed: true }];

    expect(shouldOfferChecklistCompletion(ETaskStatus.Todo, [openItem, doneItem], complete)).toBe(
      true,
    );
    expect(
      shouldOfferChecklistCompletion(
        ETaskStatus.Active,
        [openItem],
        [{ ...openItem, completed: true }],
      ),
    ).toBe(true);
    expect(shouldOfferChecklistCompletion(ETaskStatus.Todo, complete, complete)).toBe(false);
    expect(
      shouldOfferChecklistCompletion(
        ETaskStatus.Notes,
        [openItem],
        [{ ...openItem, completed: true }],
      ),
    ).toBe(false);
    expect(
      shouldOfferChecklistCompletion(
        ETaskStatus.Done,
        [openItem],
        [{ ...openItem, completed: true }],
      ),
    ).toBe(false);
    expect(
      shouldOfferChecklistCompletion(
        ETaskStatus.Cancel,
        [openItem],
        [{ ...openItem, completed: true }],
      ),
    ).toBe(false);
  });

  it('offers completion when a completed note becomes a to-do and not on the way back', () => {
    const complete = [doneItem];

    expect(
      shouldOfferChecklistCompletionOnNoteConversion(ETaskStatus.Notes, ETaskStatus.Todo, complete),
    ).toBe(true);
    expect(
      shouldOfferChecklistCompletionOnNoteConversion(ETaskStatus.Notes, ETaskStatus.Todo, [
        openItem,
      ]),
    ).toBe(false);
    expect(
      shouldOfferChecklistCompletionOnNoteConversion(ETaskStatus.Notes, ETaskStatus.Todo, []),
    ).toBe(false);
    expect(
      shouldOfferChecklistCompletionOnNoteConversion(ETaskStatus.Todo, ETaskStatus.Notes, complete),
    ).toBe(false);
    expect(
      shouldOfferChecklistCompletionOnNoteConversion(
        ETaskStatus.Active,
        ETaskStatus.Notes,
        complete,
      ),
    ).toBe(false);
  });

  it('keeps item order when moving and names the dismiss action from the status', () => {
    const items = [openItem, doneItem];

    expect(moveChecklistItem(items, 'b', -1)).toEqual([doneItem, openItem]);
    expect(moveChecklistItem(items, 'a', -1)).toBe(items);
    expect(checklistKeepLabel(ETaskStatus.Active)).toBe('Keep Active');
    expect(checklistKeepLabel(ETaskStatus.Todo)).toBe('Keep as To do');
  });
});
