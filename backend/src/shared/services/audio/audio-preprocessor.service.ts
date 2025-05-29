import ffmpeg from 'fluent-ffmpeg';
import { Readable } from 'stream';
import concat from 'concat-stream';
import { Result } from '../../core/result';
import { ServiceError } from '../../core/service-error';
import { serviceFail } from '../../core/service-fail.factory';
import { isErrorWithCode } from '../../types/guards/is-error-with-code';

export enum EAudioPreprocessorError {
  InvalidFormat = 'AUDIO_PREPROCESSOR_ERROR__INVALID_FORMAT',
  ProcessingFailed = 'AUDIO_PREPROCESSOR_ERROR__PROCESSING_FAILED',
  Timeout = 'AUDIO_PREPROCESSOR_ERROR__TIMEOUT',
}

export interface AudioPreprocessorOptions {
  removeSilence?: boolean;
  timeoutMs?: number;
}

export class AudioPreprocessorService {
  private static readonly defaultTimeoutMs = 15000;

  /** Number of consecutive silence periods (of at least START_DURATION) to trim at the start */
  private static readonly FF_START_PERIODS = 1;

  /** Minimum duration (in seconds) of a “silent period” to be considered for trimming */
  private static readonly FF_START_DURATION = 0.5;

  /** Threshold (in dB) below which audio is considered “silent” */
  private static readonly FF_START_THRESHOLD = -50;

  constructor() {}

  async removeSilence(
    inputBuffer: Buffer,
    originalName: string,
  ): Promise<Result<Buffer, ServiceError<EAudioPreprocessorError>>> {
    const ext = originalName.split('.').pop()?.toLowerCase();

    if (!ext || !['wav', 'mp3', 'ogg', 'webm', 'flac', 'm4a'].includes(ext)) {
      return serviceFail(
        `Invalid or unsupported audio format: ${ext ?? 'unknown'}`,
        EAudioPreprocessorError.InvalidFormat,
        { metadata: { originalName } },
      );
    }
    const filter =
      `silenceremove=start_periods=${AudioPreprocessorService.FF_START_PERIODS}` +
      `:start_duration=${AudioPreprocessorService.FF_START_DURATION}` +
      `:start_threshold=${AudioPreprocessorService.FF_START_THRESHOLD}dB`;

    try {
      const inputStream = Readable.from(inputBuffer);
      const command = ffmpeg(inputStream).inputFormat(ext).audioFilters(filter).format(ext);

      const output = await this.ffmpegToBuffer(command);
      return Result.ok(output);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === 'FFMPEG_TIMEOUT') {
        return serviceFail('FFmpeg processing timed out', EAudioPreprocessorError.Timeout, {
          error,
        });
      }

      return serviceFail(
        'Failed to process audio for silence removal',
        EAudioPreprocessorError.ProcessingFailed,
        { error },
      );
    }
  }

  private ffmpegToBuffer(
    command: ffmpeg.FfmpegCommand,
    timeoutMs = AudioPreprocessorService.defaultTimeoutMs,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        command.kill('SIGKILL');
        reject(Object.assign(new Error('FFmpeg process timed out'), { code: 'FFMPEG_TIMEOUT' }));
      }, timeoutMs);

      command.on('error', err => {
        clearTimeout(timeout);
        reject(err);
      });

      command.pipe(
        concat((data: Buffer) => {
          clearTimeout(timeout);
          resolve(data);
        }),
        { end: true },
      );
    });
  }
}
