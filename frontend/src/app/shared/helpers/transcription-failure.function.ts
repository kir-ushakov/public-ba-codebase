import { HttpErrorResponse } from '@angular/common/http';
import {
  ESpeechToTextUseCaseError,
  EUploadAudioUseCaseError,
  EUploadImageUseCaseError,
} from '@brainassistant/contracts';
import { readApiErrorName } from './http-error-body.function';

export type TranscriptionFailureKind = 'offline' | 'failed' | 'permanent' | 'empty';

const OFFLINE_MESSAGE = 'No connection';
const FAILED_MESSAGE = 'Transcription failed';
const UNSUPPORTED_MESSAGE = "This audio format can't be transcribed.";
const TOO_LARGE_MESSAGE = 'This recording is too large to transcribe.';
const PAYLOAD_TOO_LARGE = 413;
const UNREADABLE_MESSAGE = "This recording can't be transcribed.";
const EMPTY_MESSAGE = 'No text in this recording.';

export class TranscriptionFailure extends Error {
  readonly kind: TranscriptionFailureKind;

  constructor(kind: TranscriptionFailureKind, message: string) {
    super(message);
    this.name = 'TranscriptionFailure';
    this.kind = kind;
  }

  static offline(): TranscriptionFailure {
    return new TranscriptionFailure('offline', OFFLINE_MESSAGE);
  }

  static failed(): TranscriptionFailure {
    return new TranscriptionFailure('failed', FAILED_MESSAGE);
  }

  static unreadable(): TranscriptionFailure {
    return new TranscriptionFailure('permanent', UNREADABLE_MESSAGE);
  }

  static empty(): TranscriptionFailure {
    return new TranscriptionFailure('empty', EMPTY_MESSAGE);
  }

  static from(error: unknown): TranscriptionFailure {
    const found = unwrapFailure(error);
    if (found instanceof TranscriptionFailure) {
      return found;
    }
    if (found instanceof HttpErrorResponse) {
      return fromHttp(found);
    }
    return TranscriptionFailure.failed();
  }
}

function unwrapFailure(error: unknown): unknown {
  if (!error || typeof error !== 'object') {
    return error;
  }
  const wrapped = error as { rejection?: unknown; error?: unknown };
  if (
    wrapped.rejection instanceof TranscriptionFailure ||
    wrapped.rejection instanceof HttpErrorResponse
  ) {
    return wrapped.rejection;
  }
  if (wrapped.error instanceof TranscriptionFailure || wrapped.error instanceof HttpErrorResponse) {
    return wrapped.error;
  }
  return error;
}

function fromHttp(error: HttpErrorResponse): TranscriptionFailure {
  if (error.status === 0) {
    return TranscriptionFailure.offline();
  }
  const name = readApiErrorName(error);
  if (name === ESpeechToTextUseCaseError.UnsupportedMimeType) {
    return new TranscriptionFailure('permanent', UNSUPPORTED_MESSAGE);
  }
  if (
    name === EUploadAudioUseCaseError.FileTooLarge ||
    name === EUploadImageUseCaseError.FileTooLarge ||
    error.status === PAYLOAD_TOO_LARGE
  ) {
    return new TranscriptionFailure('permanent', TOO_LARGE_MESSAGE);
  }
  return TranscriptionFailure.failed();
}
