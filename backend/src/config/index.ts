import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['FILES_UPLOAD_PATH'];

REQUIRED_ENV_VARS.forEach(name => {
  if (!process.env[name]) {
    throw new Error(`Missing required env variable: ${name}`);
  }
});

const baseUploadPath = process.env.FILES_UPLOAD_PATH!;

export const config = {
  paths: {
    uploadTempDir: path.resolve(baseUploadPath, 'uploads'),
  },
};
