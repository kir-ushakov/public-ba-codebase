import { google } from 'googleapis';
import { GoogleDriveService } from './google-drive.service.js';
import { OAuth2Client } from 'googleapis-common';

const oAuth2Client: OAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_CALLBACK
);

const googleDriveService = new GoogleDriveService(oAuth2Client);

export { googleDriveService };
