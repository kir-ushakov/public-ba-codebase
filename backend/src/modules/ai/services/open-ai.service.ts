import OpenAI, { toFile } from 'openai';
import { Result } from '../../../shared/core/Result.js';
import { ServiceError } from '../../../shared/core/service-error.js';
import { ServiceErrorLevel } from '../../../shared/core/service-error-level.enum.js';
import { extension } from 'mime-types';
import { FileLike } from 'openai/uploads.js';

export enum EOpenAIServiceError {
  UnsupportedType = 'OPEN_AI_SERVICE_ERROR__UNSUPPORTED_TYPE',
  TranscriptAPIRequestFailed = 'OPEN_AI_SERVICE_ERROR__TRANSCRIPT_REQUEST_FAILED',
}

export class OpenAIService {
  static readonly SUPPORTED_AUDIO_MIME_TYPES = [
    'audio/mpeg',
    'audio/mp4',
    'audio/mpga',
    'audio/wav',
    'audio/x-wav',
    'audio/webm',
  ];
  static readonly MODEL_WHISPER_V1 = 'whisper-1';

  constructor(private readonly apiKey: string) {}

  async transcribeAudioFile(
    record: Blob,
  ): Promise<Result<string, ServiceError<EOpenAIServiceError>>> {
    const mimeType = record.type;

    const mimeValidation = this.validateMimeType(mimeType);
    if (mimeValidation.isFailure) return mimeValidation;

    const filenameOrError = this.createFilenameFromMimeType(mimeType, 'recording');
    if (filenameOrError.isFailure) return filenameOrError;
    const filename = filenameOrError.getValue();

    const filelike = await this.convertBlobToFile(record, filename);

    const clientOrFail = this.getClientOrFail();
    if (clientOrFail.isFailure)
      return clientOrFail as Result<never, ServiceError<EOpenAIServiceError>>;
    const client = clientOrFail.getValue();

    return await this.transcribeAudio(client, filelike);
  }

  private validateMimeType(mimeType: string): Result<never, ServiceError<EOpenAIServiceError>> {
    if (!OpenAIService.SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType)) {
      return Result.fail(
        new ServiceError(
          `Unsupported media type: ${mimeType}`,
          EOpenAIServiceError.UnsupportedType,
          undefined,
          ServiceErrorLevel.Low,
        ),
      );
    }
    return Result.ok();
  }

  // TODO: move to separate Utility  Service
  // TICKET: https://brainas.atlassian.net/browse/BA-225
  private createFilenameFromMimeType(
    mimeType: string,
    baseName: string,
  ): Result<string, ServiceError<EOpenAIServiceError>> {
    const ext = extension(mimeType);
    if (!ext) {
      return Result.fail(
        new ServiceError(
          `Could not derive extension for: ${mimeType}`,
          EOpenAIServiceError.UnsupportedType,
          undefined,
          ServiceErrorLevel.Low,
        ),
      );
    }
    const filename = `${baseName}.${ext}`;
    return Result.ok(filename);
  }

  private async convertBlobToFile(blob: Blob, filename: string): Promise<FileLike> {
    const arrayBuffer = await blob.arrayBuffer();
    return toFile(arrayBuffer, filename);
  }

  private getClientOrFail(): Result<OpenAI, ServiceError<EOpenAIServiceError>> {
    if (!this.apiKey) {
      return Result.fail(
        new ServiceError(
          'OpenAIService requires an apiKey',
          EOpenAIServiceError.TranscriptAPIRequestFailed,
          undefined,
          ServiceErrorLevel.Critical,
        ),
      );
    }
    return Result.ok(new OpenAI({ apiKey: this.apiKey }));
  }

  private async transcribeAudio(
    client: OpenAI,
    filelike: FileLike,
  ): Promise<Result<string, ServiceError<EOpenAIServiceError>>> {
    try {
      const transcription = await client.audio.transcriptions.create({
        file: filelike,
        model: OpenAIService.MODEL_WHISPER_V1,
        temperature: 0.2,
      });
      return Result.ok(transcription.text);
    } catch (error) {
      return Result.fail(
        new ServiceError(
          'OpenAI transcription API Request Failed',
          EOpenAIServiceError.TranscriptAPIRequestFailed,
          error,
          this.mapOpenAIErrorToLevel(error),
        ),
      );
    }
  }

  private mapOpenAIErrorToLevel(error: Error): ServiceErrorLevel {
    const criticalErrorStatuses = [401, 403, 429];
    if (error instanceof OpenAI.APIError && criticalErrorStatuses.includes(error.status)) {
      return ServiceErrorLevel.High;
    } else {
      return ServiceErrorLevel.Medium;
    }
  }
}
