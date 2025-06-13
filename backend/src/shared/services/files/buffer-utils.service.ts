import { toFile } from 'openai';
import { Result } from '../../core/result.js';
import { ServiceError } from '../../core/service-error.js';
import { serviceFail } from '../../core/service-fail.factory.js';
import { FileLike } from 'openai/uploads.js';

export enum EBufferUtilsError {
  FileConversionFailed = 'BUFFER_UTILS_ERROR__FILE_CONVERSION_FAILED',
}

export class BufferUtilsService {
  static async convertBufferToFile(
    buffer: Buffer,
    filename: string,
  ): Promise<Result<FileLike, ServiceError<EBufferUtilsError>>> {
    try {
      const file = await toFile(buffer, filename);
      return Result.ok(file);
    } catch (error) {
      return serviceFail<EBufferUtilsError>(
        'Failed to convert buffer to file',
        EBufferUtilsError.FileConversionFailed,
        { error },
      );
    }
  }

  static async convertBlobToBuffer(blob: Blob): Promise<Buffer> {
    const arrayBuffer = await blob.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
