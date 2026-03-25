import type { VerifyEmailParams } from './verify-email.usecase.js';
import type { VerifyEmailRequestDTO } from './verify-email.dto.js';

export function requestToUsecaseParams(dto: VerifyEmailRequestDTO): VerifyEmailParams {
  return { tokenId: dto.token };
}

