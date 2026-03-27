import OpenAI from 'openai';
import { Result } from '../../../shared/core/result.js';
import { ServiceError } from '../../../shared/core/service-error.js';
import { serviceFail } from '../../../shared/core/service-fail.factory.js';
import { ServiceErrorLevel } from '../../../shared/core/service-error-level.enum.js';

export enum OpenAIClientError {
  ApiKeyMissingOrEmpty = 'OPEN_AI_CLIENT_ERROR__API_KEY_MISSING_OR_EMPTY',
  ClientInitializationFailed = 'OPEN_AI_CLIENT_ERROR__INITIALIZATION_FAILED',
}

export class OpenAIClientService {
  constructor(private readonly apiKey?: string) {}

  public getClientOrFail(): Result<OpenAI, ServiceError<OpenAIClientError>> {
    if (!this.apiKey?.trim()) {
      return serviceFail<OpenAIClientError>(
        'OpenAI apiKey is missing or empty',
        OpenAIClientError.ApiKeyMissingOrEmpty,
        {
          level: ServiceErrorLevel.Critical,
        },
      );
    }

    try {
      return Result.ok(new OpenAI({ apiKey: this.apiKey }));
    } catch (error) {
      console.error(error);
      return serviceFail<OpenAIClientError>(
        'Init OpenAI Client Failed',
        OpenAIClientError.ClientInitializationFailed,
        {
          error,
          level: ServiceErrorLevel.Critical,
        },
      );
    }
  }
}
