import type { SignUpRequestDTO } from './signup.dto.js';
import type { SignUpParams } from './signup.usecase.js';

export function requestToUsecaseParams(payload: SignUpRequestDTO): SignUpParams {
  return {
    email: payload.email,
    firstName: payload.firstName,
    lastName: payload.lastName,
    password: payload.password,
  };
}

