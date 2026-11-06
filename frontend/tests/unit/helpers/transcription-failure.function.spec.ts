import { HttpErrorResponse } from '@angular/common/http';
import { ESpeechToTextUseCaseError, EUploadAudioUseCaseError } from '@brainassistant/contracts';
import { TranscriptionFailure } from 'src/app/shared/helpers/transcription-failure.function';

describe('TranscriptionFailure', () => {
  it('maps a dropped connection to No connection', () => {
    const failure = TranscriptionFailure.from(new HttpErrorResponse({ status: 0 }));

    expect(failure.kind).toBe('offline');
    expect(failure.message).toBe('No connection');
  });

  it('maps a transcription service failure to Transcription failed', () => {
    const failure = TranscriptionFailure.from(
      new HttpErrorResponse({
        status: 502,
        error: { name: ESpeechToTextUseCaseError.TranscribeAudioFileFailed },
      }),
    );

    expect(failure.kind).toBe('failed');
    expect(failure.message).toBe('Transcription failed');
  });

  it('maps an unsupported recording to a permanent message', () => {
    const failure = TranscriptionFailure.from(
      new HttpErrorResponse({
        status: 400,
        error: { name: ESpeechToTextUseCaseError.UnsupportedMimeType },
      }),
    );

    expect(failure.kind).toBe('permanent');
    expect(failure.message).toBe("This audio format can't be transcribed.");
  });

  it('maps an oversized upload to a permanent message', () => {
    const failure = TranscriptionFailure.from(
      new HttpErrorResponse({
        status: 413,
        error: { name: EUploadAudioUseCaseError.FileTooLarge },
      }),
    );

    expect(failure.kind).toBe('permanent');
    expect(failure.message).toBe('This recording is too large to transcribe.');
  });

  it('describes a blank transcript without treating it as a service failure', () => {
    const failure = TranscriptionFailure.empty();

    expect(failure.kind).toBe('empty');
    expect(failure.message).toBe('No text in this recording.');
  });

  it('unwraps a failure nested on the rejection', () => {
    const failure = TranscriptionFailure.from({
      rejection: TranscriptionFailure.unreadable(),
    });

    expect(failure.kind).toBe('permanent');
    expect(failure.message).toBe("This recording can't be transcribed.");
  });
});
