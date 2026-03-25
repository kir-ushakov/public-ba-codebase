import type { ReleaseClientIdParams } from './release-client-id.usecase.js';

export function requestToUsecaseParams(userId: string): ReleaseClientIdParams {
  return { userId };
}

