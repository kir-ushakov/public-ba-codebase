import path from 'path';
import fs from 'fs';
import { drive_v3, google } from 'googleapis';
import { OAuth2Client, GaxiosResponse } from 'googleapis-common';
import { Readable } from 'stream';
import mime from 'mime';
import { User } from '../../../../shared/domain/models/user.js';

export class GoogleDriveService {
  private oAuth2Client: OAuth2Client;

  constructor(oAuth2Client: OAuth2Client) {
    this.oAuth2Client = oAuth2Client;
  }

  public async listFiles(user: User) {
    const driveService: drive_v3.Drive = await this.getDirveService(user);

    const res = await driveService.files.list({
      pageSize: 10,
      fields: 'nextPageToken, files(id, name, thumbnailLink, webViewLink)',
      spaces: 'appDataFolder',
    });

    const files = res.data.files;
    if (files!.length === 0) {
      console.log('No files found.');
      return;
    }

    console.log('Files:');
    files!.map(file => {
      console.log(
        `${file.name} (${file.id}), thumb ${file.thumbnailLink}, webViewLink ${file.webViewLink}`,
      );
    });
  }

  public async uploadFile(user: User, filePath: string) {
    try {
      await this.getDirveService(user);

      const filename = path.basename(filePath);
      const extension = path.extname(filePath);
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
        body: fs.createReadStream(filePath),
      };

      const file = await service.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id',
      });

      return file.data.id;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  public async getImageById(user: User, imageId: string): Promise<GaxiosResponse<Readable>> {
    try {
      const driveService: drive_v3.Drive = await this.getDirveService(user);
      const file: GaxiosResponse<Readable> = await driveService.files.get(
        {
          fileId: imageId,
          alt: 'media',
        },
        { responseType: 'stream' },
      );

      return file;
    } catch (error) {
      // TODO: Handle error
      console.log(error);
    }
  }

  private async getDirveService(user: User): Promise<drive_v3.Drive> {
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
