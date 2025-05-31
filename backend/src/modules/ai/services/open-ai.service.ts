import OpenAI from 'openai';
import { Result } from '../../../shared/core/result.js';
import { ServiceError } from '../../../shared/core/service-error.js';
import { ServiceErrorLevel } from '../../../shared/core/service-error-level.enum.js';
import { serviceFail } from '../../../shared/core/service-fail.factory.js';
import { FileLike } from 'openai/uploads.js';
import { retry } from '../../../shared/infra/http/utils/retry-helper.function.js';
import { AudioPreprocessorService } from '../../../shared/services/audio/audio-preprocessor.service.js';
import { BufferUtilsService } from '../../../shared/services/files/buffer-utils.service.js';
import { FilenameUtilsService } from '../../../shared/services/files/filename-utils.service.js';
import { wrapServiceError } from '../../../shared/utils/wrap-service-error.functions.js';

export enum EOpenAIServiceError {
  UnsupportedType = 'OPEN_AI_SERVICE_ERROR__UNSUPPORTED_TYPE',
  TranscriptAPIRequestFailed = 'OPEN_AI_SERVICE_ERROR__TRANSCRIPT_REQUEST_FAILED',
  FilePreparationFailed = 'OPEN_AI_SERVICE_ERROR__FILE_PREPARATION_FAILED',
}

export class OpenAIService {
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
  static readonly MODEL_WHISPER_V1 = 'whisper-1';

  constructor(
    private readonly apiKey: string,
    private readonly audioPreprocessorService: AudioPreprocessorService,
  ) {}

  async transcribeAudioFile(
    audio: Blob,
  ): Promise<Result<string, ServiceError<EOpenAIServiceError>>> {
    const mimeType = audio.type;

    const mimeValidation = this.validateMimeType(mimeType);
    if (mimeValidation.isFailure) return Result.fail(mimeValidation.error);

    const filenameResult = this.createFilenameOrFail(mimeType);
    if (filenameResult.isFailure) return Result.fail(filenameResult.error);
    const filename = filenameResult.getValue();

    const buffer = await BufferUtilsService.convertBlobToBuffer(audio);

    let processedBuffer = buffer;
    const preprocessedResult = await this.audioPreprocessorService.removeSilence(buffer, filename);
    if (preprocessedResult.isSuccess) {
      processedBuffer = preprocessedResult.getValue();
    } else {
      console.warn('Silence removal failed, proceeding with original audio.');
    }

    const fileResult = await this.convertBufferToFileOrFail(processedBuffer, filename);
    if (fileResult.isFailure) return Result.fail(fileResult.error);
    const filelike = fileResult.getValue();

    const openAIClientResult = this.getClientOrFail();
    if (openAIClientResult.isFailure) return Result.fail(openAIClientResult.error);
    const openAIClient = openAIClientResult.getValue();

    return await this.transcribeAudioWithOpenAI(openAIClient, filelike);
  }

  private validateMimeType(mimeType: string): Result<void, ServiceError<EOpenAIServiceError>> {
    if (!OpenAIService.SUPPORTED_AUDIO_MIME_TYPES.includes(mimeType)) {
      return serviceFail<EOpenAIServiceError>(
        `Unsupported media type: ${mimeType}`,
        EOpenAIServiceError.UnsupportedType,
        {
          level: ServiceErrorLevel.Low,
        },
      );
    }
    return Result.ok();
  }

  private createFilenameOrFail(
    mimeType: string,
  ): Result<string, ServiceError<EOpenAIServiceError>> {
    const filenameResult = FilenameUtilsService.createFromMimeType(mimeType, 'audio', {
      includeRandom: true,
      overrides: { 'audio/webm': 'webm' },
    });

    if (filenameResult.isFailure) {
      return wrapServiceError<EOpenAIServiceError>(
        'Failed to create filename from MIME type',
        EOpenAIServiceError.FilePreparationFailed,
        filenameResult.error,
      );
    }

    return Result.ok(filenameResult.getValue());
  }

  private async convertBufferToFileOrFail(
    buffer: Buffer,
    filename: string,
  ): Promise<Result<FileLike, ServiceError<EOpenAIServiceError>>> {
    const result = await BufferUtilsService.convertBufferToFile(buffer, filename);

    if (result.isFailure) {
      return wrapServiceError<EOpenAIServiceError>(
        'Failed to convert audio buffer to file for transcription',
        EOpenAIServiceError.FilePreparationFailed,
        result.error,
      );
    }

    return Result.ok(result.getValue());
  }

  private getClientOrFail(): Result<OpenAI, ServiceError<EOpenAIServiceError>> {
    try {
      return Result.ok(new OpenAI({ apiKey: this.apiKey }));
    } catch (error) {
      console.error(error);
      return serviceFail<EOpenAIServiceError>(
        'OpenAI transcription API Request Failed',
        EOpenAIServiceError.TranscriptAPIRequestFailed,
        {
          error: error,
          level: ServiceErrorLevel.Critical,
        },
      );
    }
  }

  private async transcribeAudioWithOpenAI(
    client: OpenAI,
    filelike: FileLike,
  ): Promise<Result<string, ServiceError<EOpenAIServiceError>>> {
    try {
      const transcription = await retry(() =>
        client.audio.transcriptions.create({
          file: filelike,
          model: OpenAIService.MODEL_WHISPER_V1,
          temperature: 0.2,
        }),
      );
      return Result.ok(transcription.text);
    } catch (error) {
      console.error(error);
      return serviceFail<EOpenAIServiceError>(
        'OpenAI transcription API Request Failed',
        EOpenAIServiceError.TranscriptAPIRequestFailed,
        {
          level: this.mapOpenAIErrorToLevel(error),
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
