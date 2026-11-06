import { microphoneFailureMessage } from 'src/app/shared/features/voice-input/microphone-failure-message.function';

describe('microphoneFailureMessage', () => {
  it('names a denied permission', () => {
    expect(microphoneFailureMessage(new DOMException('nope', 'NotAllowedError'))).toBe(
      'Microphone access was denied.',
    );
  });

  it('names a missing microphone', () => {
    expect(microphoneFailureMessage(new Error('This device cannot record audio'))).toBe(
      'No microphone is available.',
    );
  });

  it('names a device that cannot start', () => {
    expect(microphoneFailureMessage(new DOMException('busy', 'NotReadableError'))).toBe(
      'The microphone could not be started.',
    );
  });

  it('uses a general recorder message for an unknown failure', () => {
    expect(microphoneFailureMessage(new Error('encoder missing'))).toBe(
      'The recorder could not be started.',
    );
  });
});
