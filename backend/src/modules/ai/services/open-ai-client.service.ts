import OpenAI from 'openai';
import { Result } from '../../../shared/core/result.js';
import { ServiceError } from '../../../shared/core/service-error.js';
import { serviceFail } from '../../../shared/core/service-fail.factory.js';
import { ServiceErrorLevel } from '../../../shared/core/service-error-level.enum.js';

export enum OpenAIClientError {
  ClientInitializationFailed = 'OPEN_AI_CLIENT_ERROR__INITIALIZATION_FAILED',
}

export class OpenAIClientService {
  constructor(private readonly apiKey: string) {}

  public getClientOrFail(): Result<OpenAI, ServiceError<OpenAIClientError>> {
    try {
      return Result.ok(new OpenAI({ apiKey: this.apiKey }));
    } catch (error) {
      console.error(error);
      return serviceFail<OpenAIClientError>(
        'Init OpenAI Client Failed',
        OpenAIClientError.ClientInitializationFailed,
        {
          error: error,
          level: ServiceErrorLevel.Critical,
        },
      );
    }
  }
}
