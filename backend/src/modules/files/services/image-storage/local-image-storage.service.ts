import path from 'path';
import { createReadStream, promises as fsp } from 'fs';
import { Result } from '../../../../shared/core/result.js';
import { serviceFail } from '../../../../shared/core/service-fail.factory.js';
import { ServiceErrorLevel } from '../../../../shared/core/service-error-level.enum.js';
import { isErrorWithCode } from '../../../../shared/types/guards/is-error-with-code.js';
import { EImageStorageError } from './image-storage.error.js';
import {
  IImageStorage,
  ImageStorageResult,
  PutImageParams,
  StoredImageFile,
} from './image-storage.interface.js';
import { buildImageRelativePath, resolveInsideRoot } from './image-storage-path.function.js';

/** Files live under `<rootDir>/<userId>/<shard>/<imageId>.<ext>`; fileId is that relative path. */
export class LocalImageStorage implements IImageStorage {
  constructor(private readonly rootDir: string) {}

  public async put(params: PutImageParams): Promise<ImageStorageResult<string>> {
    const relativePath = buildImageRelativePath(params.userId, params.imageId, params.extension);
    const destination = relativePath ? resolveInsideRoot(this.rootDir, relativePath) : null;
    if (!relativePath || !destination) {
      return failInvalidPath({ userId: params.userId, imageId: params.imageId });
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- destination checked against rootDir
      await fsp.mkdir(path.dirname(destination), { recursive: true });
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- source is the upload pipeline file, destination checked against rootDir
      await fsp.rename(params.sourcePath, destination);
    } catch (error) {
      return serviceFail('Failed to store image', EImageStorageError.WriteFailed, {
        error,
        level: ServiceErrorLevel.High,
        metadata: { userId: params.userId, imageId: params.imageId },
      });
    }

    return Result.ok(relativePath);
  }

  public async get(fileId: string): Promise<ImageStorageResult<StoredImageFile>> {
    const filePath = resolveInsideRoot(this.rootDir, fileId);
    if (!filePath) {
      return failInvalidPath({ fileId });
    }

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath checked against rootDir
      const stat = await fsp.stat(filePath);
      return Result.ok({
        // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath checked against rootDir
        data: createReadStream(filePath),
        sizeBytes: stat.size,
        modifiedAt: stat.mtime,
      });
    } catch (error) {
      return failRead(error, fileId);
    }
  }
}

function failInvalidPath(metadata: Record<string, unknown>): ImageStorageResult<never> {
  return serviceFail('Image path escapes the storage root', EImageStorageError.InvalidPath, {
    level: ServiceErrorLevel.High,
    metadata,
  });
}

function failRead(error: unknown, fileId: string): ImageStorageResult<never> {
  if (isErrorWithCode(error) && error.code === 'ENOENT') {
    return serviceFail('Image file is missing from storage', EImageStorageError.FileMissing, {
      level: ServiceErrorLevel.High,
      metadata: { fileId },
    });
  }
  return serviceFail('Failed to read image from storage', EImageStorageError.ReadFailed, {
    error,
    level: ServiceErrorLevel.High,
    metadata: { fileId },
  });
}
