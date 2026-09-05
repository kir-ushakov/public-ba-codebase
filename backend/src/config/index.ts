import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_ENV_VARS = ['FILES_UPLOAD_PATH'];

REQUIRED_ENV_VARS.forEach(name => {
  // Fixed allowlist of required env names — not user-controlled keys.
  // eslint-disable-next-line security/detect-object-injection
  if (!process.env[name]) {
    throw new Error(`Missing required env variable: ${name}`);
  }
});

const baseUploadPath = process.env.FILES_UPLOAD_PATH;

export const config = {
  paths: {
    uploadTempDir: path.resolve(baseUploadPath, 'uploads'),
  },
};
