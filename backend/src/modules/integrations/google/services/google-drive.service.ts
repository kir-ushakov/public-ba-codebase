import path from 'path';
import fs from 'fs';
import { drive, drive_v3 } from 'googleapis/build/src/apis/drive/index.js';
import { OAuth2Client } from 'googleapis-common';
import { Readable } from 'stream';
import mime from 'mime';
import { User } from '../../../../shared/domain/models/user.js';
import { config as defaultConfig } from '../../../../config/index.js';

export type GoogleDriveImageFile = {
  data: Readable;
  headers: Record<string, string | undefined>;
};

export class GoogleDriveService {
  constructor(
    private readonly oAuth2Client: OAuth2Client,
    private readonly logger = console,
    private readonly config = defaultConfig,
  ) {
    this.oAuth2Client = oAuth2Client;
  }

  public async listFiles(user: User): Promise<void> {
    const driveService: drive_v3.Drive = await this.getDriveService(user);

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

  public async uploadFile(user: User, filePath: string): Promise<string | null | undefined> {
    try {
      const safeBaseDir = this.config.paths.uploadTempDir;
      const resolvedFilePath = path.resolve(filePath);
      if (!resolvedFilePath.startsWith(safeBaseDir)) {
        throw new Error('Invalid file path');
      }

      await this.getDriveService(user);

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

      return file.data.id;
    } catch (err) {
      this.logger.error('Upload failed:', err);
      throw err;
    }
  }

  public async getImageById(user: User, imageId: string): Promise<GoogleDriveImageFile> {
    try {
      const driveService: drive_v3.Drive = await this.getDriveService(user);
      const file = await driveService.files.get(
        {
          fileId: imageId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      return {
        data: file.data as Readable,
        headers: gaxiosHeadersToRecord(file.headers),
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async getDriveService(user: User): Promise<drive_v3.Drive> {
    this.oAuth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });
    await this.oAuth2Client.refreshAccessToken();

    const options: drive_v3.Options = {
      version: 'v3',
      auth: this.oAuth2Client,
    };
    const driveService = drive(options);
    return driveService;
  }
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
