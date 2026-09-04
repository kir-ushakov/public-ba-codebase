import { extension } from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import { Result } from '../../core/result.js';
import { ServiceError } from '../../core/service-error.js';
import { serviceFail } from '../../core/service-fail.factory.js';

export enum EFilenameUtilsError {
  ExtensionDerivationFailed = 'FILENAME_UTILS_ERROR__EXTENSION_DERIVATION_FAILED',
}

export class FilenameUtilsService {
  static createFromMimeType(
    mimeType: string,
    baseName: string,
    options?: { includeRandom?: boolean; overrides?: Record<string, string> },
  ): Result<string, ServiceError<EFilenameUtilsError>> {
    const overrideExt = options?.overrides
      ? Object.entries(options.overrides).find(([key]) => key === mimeType)?.[1]
      : undefined;
    const ext = overrideExt ?? extension(mimeType);

    if (!ext) {
      return serviceFail(
        `Could not derive extension for: ${mimeType}`,
        EFilenameUtilsError.ExtensionDerivationFailed,
        { metadata: { mimeType } },
      );
    }

    const randomPart = options?.includeRandom ? `-${uuidv4()}` : '';
    const filename = `${baseName}${randomPart}.${ext}`;
    return Result.ok(filename);
  }
}
