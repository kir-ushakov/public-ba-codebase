import path from 'path';
import fs from 'fs';
import { drive_v3, google } from 'googleapis';
import { OAuth2Client, GaxiosResponse } from 'googleapis-common';
import { Readable } from 'stream';
import mime from 'mime';
import { User } from '../../../../shared/domain/models/user.js';
import { config as defaultConfig } from '../../../../config/index.js';

export class GoogleDriveService {
  constructor(
    private readonly oAuth2Client: OAuth2Client,
    private readonly logger = console,
    private readonly config = defaultConfig,
  ) {
    this.oAuth2Client = oAuth2Client;
  }

  public async listFiles(user: User) {
    const driveService: drive_v3.Drive = await this.getDriveService(user);

    const res = await driveService.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, thumbnailLink, webViewLink)',
      spaces: 'appDataFolder',
    });

    const files = res.data.files;
    if (files!.length === 0) {
      this.logger.log('No files found.');
      return;
    }

    this.logger.log('Files:');
    files!.forEach(file => {
      this.logger.log(
        `${file.name} (${file.id}), thumb ${file.thumbnailLink}, webViewLink ${file.webViewLink}`,
      );
    });
  }

  public async uploadFile(user: User, filePath: string) {
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
      const service = google.drive(options);

      const fileMetadata = {
        name: filename,
        parents: ['appDataFolder'],
      };

      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(resolvedFilePath),
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

  public async getImageById(user: User, imageId: string): Promise<GaxiosResponse<Readable>> {
    try {
      const driveService: drive_v3.Drive = await this.getDriveService(user);
      const file: GaxiosResponse<Readable> = await driveService.files.get(
        {
          fileId: imageId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      return file;
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  private async getDriveService(user: User): Promise<drive_v3.Drive> {
    this.oAuth2Client.setCredentials({
      refresh_token: user.googleRefreshToken,
    });
    await this.oAuth2Client.refreshAccessToken();

    const options: drive_v3.Options = {
      version: 'v3',
      auth: this.oAuth2Client,
    };
    const driveService = google.drive(options);
    return driveService;
  }
}
