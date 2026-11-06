import path from 'path';
import { requiredEnv } from './required-env.js';

const baseUploadPath = requiredEnv('FILES_UPLOAD_PATH');

export const config = {
  paths: {
    uploadTempDir: path.resolve(baseUploadPath, 'uploads'),
    imagesDir: path.resolve(baseUploadPath, 'images'),
    audioDir: path.resolve(baseUploadPath, 'audio'),
  },
};
