const PERMISSION_DENIED = 'Microphone access was denied.';
const NO_MICROPHONE = 'No microphone is available.';
const DEVICE_FAILED = 'The microphone could not be started.';
const RECORDER_FAILED = 'The recorder could not be started.';
const DISCONNECTED = 'The microphone disconnected.';

export function microphoneFailureMessage(error: unknown): string {
  const cause = unwrap(error);
  if (cause instanceof DOMException) {
    if (
      cause.name === 'NotAllowedError' ||
      cause.name === 'PermissionDeniedError' ||
      cause.name === 'SecurityError'
    ) {
      return PERMISSION_DENIED;
    }
    if (cause.name === 'NotFoundError' || cause.name === 'DevicesNotFoundError') {
      return NO_MICROPHONE;
    }
    if (
      cause.name === 'NotReadableError' ||
      cause.name === 'TrackStartError' ||
      cause.name === 'OverconstrainedError'
    ) {
      return DEVICE_FAILED;
    }
  }

  const message = cause instanceof Error ? cause.message : '';
  if (/permission/i.test(message)) {
    return PERMISSION_DENIED;
  }
  if (/cannot record|no microphone|not found/i.test(message)) {
    return NO_MICROPHONE;
  }
  if (/disconnect/i.test(message)) {
    return DISCONNECTED;
  }
  if (/could not be started|not readable|device/i.test(message)) {
    return DEVICE_FAILED;
  }
  return RECORDER_FAILED;
}

function unwrap(error: unknown): unknown {
  if (!error || typeof error !== 'object' || !('rejection' in error)) {
    return error;
  }
  return (error as { rejection: unknown }).rejection;
}
