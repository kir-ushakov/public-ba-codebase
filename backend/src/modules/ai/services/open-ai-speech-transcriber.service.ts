import OpenAI from 'openai';
import { Result } from '../../../shared/core/result.js';
import { ServiceError } from '../../../shared/core/service-error.js';
import { ServiceErrorLevel } from '../../../shared/core/service-error-level.enum.js';
import { serviceFail } from '../../../shared/core/service-fail.factory.js';
import { FileLike } from 'openai/uploads.js';
import { retry } from '../../../shared/infra/http/utils/retry-helper.function.js';
import { BufferUtilsService } from '../../../shared/services/files/buffer-utils.service.js';
import { FilenameUtilsService } from '../../../shared/services/files/filename-utils.service.js';
import { wrapServiceError } from '../../../shared/utils/wrap-service-error.functions.js';
import { OpenAIClientService } from './open-ai-client.service.js';

export enum OpenAISpeechTranscriberError {
  UnsupportedType = 'OPEN_AI_SERVICE_ERROR__UNSUPPORTED_TYPE',
  ClientInitializationFailed = 'OPEN_AI_SERVICE_ERROR__CLIENT_INITIALIZATION_FAILED',
  TranscriptAPIRequestFailed = 'OPEN_AI_SERVICE_ERROR__TRANSCRIPT_REQUEST_FAILED',
  FilePreparationFailed = 'OPEN_AI_SERVICE_ERROR__FILE_PREPARATION_FAILED',
}

export class OpenAISpeechTranscriberService {
  static readonly SUPPORTED_AUDIO_MIME_TYPES = [
    'audio/flac',
    'audio/mp4',
    'audio/x-m4a',
    'audio/mpeg',
    'audio/mpga',
    'audio/wav',
    'audio/x-wav',
    'audio/webm',
    'audio/ogg',
  ];
  private static readonly MIME_TYPE_OVERRIDES: Record<string, string> = {
    'audio/webm': 'webm',
  };
  static readonly MODEL_WHISPER_V1 = 'whisper-1';

  constructor(private readonly openAIClientService: OpenAIClientService) {}

  async transcribeAudioFile(
    audio: Blob,
  ): Promise<Result<string, ServiceError<OpenAISpeechTranscriberError>>> {
    const mimeType = audio.type;

    const mimeValidation = this.validateMimeType(mimeType);
    if (mimeValidation.isFailure) return Result.fail(mimeValidation.error);

    const filenameResult = this.createFilenameOrFail(mimeType);
    if (filenameResult.isFailure) return Result.fail(filenameResult.error);
    const filename = filenameResult.getValue();

    const buffer = await BufferUtilsService.convertBlobToBuffer(audio);

    const fileResult = await this.convertBufferToFileOrFail(buffer, filename);
    if (fileResult.isFailure) return Result.fail(fileResult.error);
    const filelike = fileResult.getValue();

    const openAIClientResult = await this.getClientOrFail();
    if (openAIClientResult.isFailure) return Result.fail(openAIClientResult.error);
    const openAIClient = openAIClientResult.getValue();

    return await this.transcribeAudioWithOpenAI(openAIClient, filelike);
  }

  private validateMimeType(
    mimeType: string,
  ): Result<void, ServiceError<OpenAISpeechTranscriberError>> {
    if (!OpenAISpeechTranscriberService.SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType)) {
      return serviceFail<OpenAISpeechTranscriberError>(
        `Unsupported media type: ${mimeType}`,
        OpenAISpeechTranscriberError.UnsupportedType,
        {
          level: ServiceErrorLevel.Low,
        },
      );
    }
    return Result.ok();
  }

  private createFilenameOrFail(
    mimeType: string,
  ): Result<string, ServiceError<OpenAISpeechTranscriberError>> {
    const filenameResult = FilenameUtilsService.createFromMimeType(mimeType, 'audio', {
      includeRandom: true,
      overrides: OpenAISpeechTranscriberService.MIME_TYPE_OVERRIDES,
    });

    if (filenameResult.isFailure) {
      return wrapServiceError<OpenAISpeechTranscriberError>(
        'Failed to create filename from MIME type',
        OpenAISpeechTranscriberError.FilePreparationFailed,
        filenameResult.error,
      );
    }

    return Result.ok(filenameResult.getValue());
  }

  private async convertBufferToFileOrFail(
    buffer: Buffer,
    filename: string,
  ): Promise<Result<FileLike, ServiceError<OpenAISpeechTranscriberError>>> {
    const result = await BufferUtilsService.convertBufferToFile(buffer, filename);

    if (result.isFailure) {
      return wrapServiceError<OpenAISpeechTranscriberError>(
        'Failed to convert audio buffer to file for transcription',
        OpenAISpeechTranscriberError.FilePreparationFailed,
        result.error,
      );
    }

    return Result.ok(result.getValue());
  }

  private async getClientOrFail(): Promise<
    Result<OpenAI, ServiceError<OpenAISpeechTranscriberError>>
  > {
    const openAIClientResult = this.openAIClientService.getClientOrFail();
    if (openAIClientResult.isFailure) {
      return wrapServiceError<OpenAISpeechTranscriberError>(
        'Failed to initialize OpenAI client',
        OpenAISpeechTranscriberError.ClientInitializationFailed,
        openAIClientResult.error,
      );
    }
    return Result.ok(openAIClientResult.getValue());
  }

  private async transcribeAudioWithOpenAI(
    client: OpenAI,
    filelike: FileLike,
  ): Promise<Result<string, ServiceError<OpenAISpeechTranscriberError>>> {
    try {
      const transcription = await retry(() =>
        client.audio.transcriptions.create({
          file: filelike,
          model: OpenAISpeechTranscriberService.MODEL_WHISPER_V1,
          temperature: 0,
        }),
      );
      console.log('++++++++++ !!!');
      console.log(filelike.type);
      return Result.ok(transcription.text);
    } catch (error) {
      console.error(error);
      return serviceFail<OpenAISpeechTranscriberError>(
        'OpenAI transcription API Request Failed',
        OpenAISpeechTranscriberError.TranscriptAPIRequestFailed,
        {
          level: this.mapOpenAIErrorToLevel(error),
          error: error,
          metadata: {
            model: OpenAISpeechTranscriberService.MODEL_WHISPER_V1,
            fileName: filelike.name,
            fileSize: filelike.size ?? 'unknown',
            mimeType: filelike.type ?? 'unknown',
            timestamp: new Date().toISOString(),
          },
        },
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
