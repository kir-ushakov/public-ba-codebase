import { TaskConst } from '@brainassistant/contracts';
import {
  ETaskDescriptionError,
  TaskDescription,
} from '../../../src/shared/domain/values/task/task-description.js';
import { sampleDescription } from './task-description.fixture.js';

describe('TaskDescription', () => {
  describe('create', () => {
    it('accepts a document with bold text and a bullet list', () => {
      const result = TaskDescription.create(sampleDescription);

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().isEmpty()).toBe(false);
      expect(result.getValue().toJSON()).toEqual(sampleDescription);
    });

    it('treats an empty document as empty but valid', () => {
      const result = TaskDescription.create({ type: 'doc', content: [{ type: 'paragraph' }] });

      expect(result.isSuccess).toBe(true);
      expect(result.getValue().isEmpty()).toBe(true);
    });

    it('rejects an unsupported node type', () => {
      const result = TaskDescription.create({
        type: 'doc',
        content: [{ type: 'heading', content: [{ type: 'text', text: 'Nope' }] }],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskDescriptionError.Invalid);
    });

    it('rejects a javascript: link', () => {
      const result = TaskDescription.create({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: 'bad',
                marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }],
              },
            ],
          },
        ],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskDescriptionError.Invalid);
    });

    it('rejects text longer than the maximum', () => {
      const result = TaskDescription.create({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'a'.repeat(TaskConst.DESCRIPTION_MAX_TEXT_LENGTH + 1) },
            ],
          },
        ],
      });

      expect(result.isFailure).toBe(true);
      expect(result.error.code).toBe(ETaskDescriptionError.TooLong);
    });
  });
});
