import path from 'path';
import { createReadStream, promises as fsp } from 'fs';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { serviceFail } from '../../../../shared/core/service-fail.factory.js';
import { ServiceErrorLevel } from '../../../../shared/core/service-error-level.enum.js';
import { isErrorWithCode } from '../../../../shared/types/guards/is-error-with-code.js';
import { resolveInsideRoot } from '../image-storage/image-storage-path.function.js';

const SAFE_SEGMENT = /^[A-Za-z0-9-]{1,64}$/;

export enum EAudioStorageError {
  InvalidPath = 'AUDIO_STORAGE_ERROR__INVALID_PATH',
  WriteFailed = 'AUDIO_STORAGE_ERROR__WRITE_FAILED',
  FileMissing = 'AUDIO_STORAGE_ERROR__FILE_MISSING',
  ReadFailed = 'AUDIO_STORAGE_ERROR__READ_FAILED',
}

export type StoredAudioFile = {
  data: ReturnType<typeof createReadStream>;
  sizeBytes: number;
  mimeType: string;
};

const MIME_TO_EXTENSION: Record<string, string> = {
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mpga': 'mpga',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
};

export function extensionForMime(mimeType: string): string | null {
  const base = mimeType.split(';', 1)[0]?.trim().toLowerCase() ?? '';
  return MIME_TO_EXTENSION[base] ?? null;
}

export function isSafeAudioId(audioId: string): boolean {
  return typeof audioId === 'string' && SAFE_SEGMENT.test(audioId);
}

export class LocalAudioStorage {
  constructor(private readonly rootDir: string) {}

  public async put(params: {
    userId: string;
    audioId: string;
    sourcePath: string;
    mimeType: string;
  }): Promise<Result<void, ServiceError<EAudioStorageError>>> {
    const extension = extensionForMime(params.mimeType);
    const relative = extension ? this.relativeFile(params.userId, params.audioId, extension) : null;
    const destination = relative ? resolveInsideRoot(this.rootDir, relative) : null;
    const metaPath = this.metaPath(params.userId, params.audioId);
    if (!destination || !metaPath) {
      return serviceFail('Audio path escapes the storage root', EAudioStorageError.InvalidPath, {
        level: ServiceErrorLevel.High,
        metadata: { userId: params.userId, audioId: params.audioId },
      });
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- destination checked against rootDir
      await fsp.mkdir(path.dirname(destination), { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- upload temp path into a checked destination
      await fsp.rename(params.sourcePath, destination);
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- meta path checked against rootDir
      await fsp.writeFile(
        metaPath,
        JSON.stringify({ mimeType: params.mimeType, extension }),
        'utf8',
      );
      return Result.ok(undefined);
    } catch (error) {
      return serviceFail('Failed to store audio', EAudioStorageError.WriteFailed, {
        error,
        level: ServiceErrorLevel.High,
        metadata: { userId: params.userId, audioId: params.audioId },
      });
    }
  }

  public async get(params: {
    userId: string;
    audioId: string;
  }): Promise<Result<StoredAudioFile, ServiceError<EAudioStorageError>>> {
    const metaPath = this.metaPath(params.userId, params.audioId);
    if (!metaPath) {
      return serviceFail('Audio path escapes the storage root', EAudioStorageError.InvalidPath, {
        level: ServiceErrorLevel.High,
      });
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- meta path checked against rootDir
      const raw = await fsp.readFile(metaPath, 'utf8');
      const meta = JSON.parse(raw) as { mimeType?: string; extension?: string };
      if (!meta.extension || !meta.mimeType) {
        return serviceFail('Audio file is missing from storage', EAudioStorageError.FileMissing, {
          level: ServiceErrorLevel.Medium,
        });
      }
      const relative = this.relativeFile(params.userId, params.audioId, meta.extension);
      const filePath = relative ? resolveInsideRoot(this.rootDir, relative) : null;
      if (!filePath) {
        return serviceFail('Audio path escapes the storage root', EAudioStorageError.InvalidPath, {
          level: ServiceErrorLevel.High,
        });
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- file path checked against rootDir
      const stat = await fsp.stat(filePath);
      return Result.ok({
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- file path checked against rootDir
        data: createReadStream(filePath),
        sizeBytes: stat.size,
        mimeType: meta.mimeType,
      });
    } catch (error) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        return serviceFail('Audio file is missing from storage', EAudioStorageError.FileMissing, {
          level: ServiceErrorLevel.Medium,
        });
      }
      return serviceFail('Failed to read audio from storage', EAudioStorageError.ReadFailed, {
        error,
        level: ServiceErrorLevel.High,
      });
    }
  }

  public async delete(params: {
    userId: string;
    audioId: string;
  }): Promise<Result<void, ServiceError<EAudioStorageError>>> {
    const metaPath = this.metaPath(params.userId, params.audioId);
    if (!metaPath) {
      return serviceFail('Audio path escapes the storage root', EAudioStorageError.InvalidPath, {
        level: ServiceErrorLevel.High,
      });
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- meta path checked against rootDir
      const raw = await fsp.readFile(metaPath, 'utf8');
      const meta = JSON.parse(raw) as { extension?: string };
      const relative = meta.extension
        ? this.relativeFile(params.userId, params.audioId, meta.extension)
        : null;
      const filePath = relative ? resolveInsideRoot(this.rootDir, relative) : null;
      if (filePath) {
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- file path checked against rootDir
        await fsp.rm(filePath, { force: true });
      }
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- meta path checked against rootDir
      await fsp.rm(metaPath, { force: true });
      return Result.ok(undefined);
    } catch (error) {
      if (isErrorWithCode(error) && error.code === 'ENOENT') {
        return Result.ok(undefined);
      }
      return serviceFail('Failed to delete audio', EAudioStorageError.WriteFailed, {
        error,
        level: ServiceErrorLevel.Medium,
      });
    }
  }

  private relativeFile(userId: string, audioId: string, extension: string): string | null {
    if (
      !SAFE_SEGMENT.test(userId) ||
      !isSafeAudioId(audioId) ||
      !/^[a-z0-9]{1,8}$/.test(extension)
    ) {
      return null;
    }
    const shard = audioId.slice(0, 2).toLowerCase();
    return path.posix.join(userId, shard, `${audioId}.${extension}`);
  }

  private metaPath(userId: string, audioId: string): string | null {
    const relative = this.relativeFile(userId, audioId, 'json');
    return relative
      ? resolveInsideRoot(this.rootDir, relative.replace(/\.json$/, '.meta.json'))
      : null;
  }
}
