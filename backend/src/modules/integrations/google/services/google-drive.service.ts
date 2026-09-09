import path from 'path';
import fs from 'fs';
import { drive, drive_v3 } from 'googleapis/build/src/apis/drive/index.js';
import { OAuth2Client } from 'googleapis-common';
import { Readable } from 'stream';
import mime from 'mime';
import { User } from '../../../../shared/domain/models/user.js';
import { config as defaultConfig } from '../../../../config/index.js';
import { Result } from '../../../../shared/core/result.js';
import { ServiceError } from '../../../../shared/core/service-error.js';
import { ServiceErrorLevel } from '../../../../shared/core/service-error-level.enum.js';
import { serviceFail } from '../../../../shared/core/service-fail.factory.js';
import { isGoogleInvalidGrant } from './google-invalid-grant.js';
import { EGoogleDriveServiceError } from './google-drive-service.error.js';

export { EGoogleDriveServiceError };

export type GoogleDriveImageFile = {
  data: Readable;
  headers: Record<string, string | undefined>;
};

export type GoogleDriveServiceResult<T> = Result<T, ServiceError<EGoogleDriveServiceError>>;

export class GoogleDriveService {
  constructor(
    private readonly oAuth2Client: OAuth2Client,
    private readonly logger = console,
    private readonly config = defaultConfig,
  ) {
    this.oAuth2Client = oAuth2Client;
  }

  public async listFiles(user: User): Promise<void> {
    const driveOrError = await this.getDriveService(user);
    if (driveOrError.isFailure) {
      return;
    }
    const driveService: drive_v3.Drive = driveOrError.getValue();

    const res = await driveService.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, thumbnailLink, webViewLink)',
      spaces: 'appDataFolder',
    });

    const files = res.data.files;
    if (files.length === 0) {
      this.logger.log('No files found.');
      return;
    }

    this.logger.log('Files:');
    files.forEach(file => {
      this.logger.log(
        `${file.name} (${file.id}), thumb ${file.thumbnailLink}, webViewLink ${file.webViewLink}`,
      );
    });
  }

  public async uploadFile(user: User, filePath: string): Promise<GoogleDriveServiceResult<string>> {
    try {
      const safeBaseDir = this.config.paths.uploadTempDir;
      const resolvedFilePath = path.resolve(filePath);
      if (!resolvedFilePath.startsWith(safeBaseDir)) {
        return failGoogleDriveRequest('Invalid file path');
      }

      const driveOrError = await this.getDriveService(user);
      if (driveOrError.isFailure) {
        return Result.fail(driveOrError.error);
      }

      const filename = path.basename(resolvedFilePath);
      const extension = path.extname(resolvedFilePath);
      const mimeType = mime.getType(extension);

      const options: drive_v3.Options = {
        version: 'v3',
        auth: this.oAuth2Client,
      };
      const service = drive(options);

      const fileMetadata = {
        name: filename,
        parents: ['appDataFolder'],
      };

      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(resolvedFilePath), // eslint-disable-line security/detect-non-literal-fs-filename -- path checked against uploadTempDir
      };

      const file = await service.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      const fileId = file.data.id;
      if (!fileId) {
        return failGoogleDriveRequest('Google Drive did not return a file id');
      }

      return Result.ok(fileId);
    } catch (err) {
      return failFromGoogleError(err);
    }
  }

  public async getImageById(
    user: User,
    imageId: string,
  ): Promise<GoogleDriveServiceResult<GoogleDriveImageFile>> {
    try {
      const driveOrError = await this.getDriveService(user);
      if (driveOrError.isFailure) {
        return Result.fail(driveOrError.error);
      }
      const driveService: drive_v3.Drive = driveOrError.getValue();
      const file = await driveService.files.get(
        {
          fileId: imageId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      return Result.ok({
        data: file.data,
        headers: gaxiosHeadersToRecord(file.headers),
      });
    } catch (error) {
      return failFromGoogleError(error);
    }
  }

  private async getDriveService(user: User): Promise<GoogleDriveServiceResult<drive_v3.Drive>> {
    try {
      this.oAuth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });
      await this.oAuth2Client.refreshAccessToken();

      const options: drive_v3.Options = {
        version: 'v3',
        auth: this.oAuth2Client,
      };
      return Result.ok(drive(options));
    } catch (error) {
      return failFromGoogleError(error);
    }
  }
}

function failFromGoogleError(
  error: unknown,
): Result<never, ServiceError<EGoogleDriveServiceError>> {
  if (isGoogleInvalidGrant(error)) {
    return serviceFail<EGoogleDriveServiceError>(
      'Google refresh token is invalid or revoked',
      EGoogleDriveServiceError.InvalidGrant,
      {
        level: ServiceErrorLevel.Medium,
        error: new Error('invalid_grant'),
        metadata: { googleError: 'invalid_grant' },
      },
    );
  }

  return failGoogleDriveRequest('Google Drive request failed');
}

function failGoogleDriveRequest(
  message: string,
): Result<never, ServiceError<EGoogleDriveServiceError>> {
  return serviceFail<EGoogleDriveServiceError>(message, EGoogleDriveServiceError.RequestFailed, {
    level: ServiceErrorLevel.Medium,
  });
}

function gaxiosHeadersToRecord(headers: unknown): Record<string, string | undefined> {
  const record: Record<string, string | undefined> = {};
  if (headers == null || typeof headers !== 'object') {
    return record;
  }

  if (isFetchHeaders(headers)) {
    headers.forEach((value, key) => {
      record[key] = value;
    });
    return record;
  }

  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key === 'statusCode') {
      continue;
    }
    if (typeof value === 'string') {
      record[key] = value;
    } else if (typeof value === 'number') {
      record[key] = String(value);
    } else if (Array.isArray(value)) {
      record[key] = value.map(String).join(', ');
    }
  }
  return record;
}

function isFetchHeaders(headers: object): headers is Headers {
  return (
    typeof (headers as Headers).forEach === 'function' &&
    typeof (headers as Headers).get === 'function'
  );
}
