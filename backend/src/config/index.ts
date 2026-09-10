import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

export function requiredEnv(name: string): string {
  // Fixed allowlist of required env names — not user-controlled keys.
  // eslint-disable-next-line security/detect-object-injection
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env variable: ${name}`);
  }
  return value;
}

const REQUIRED_ENV_VARS = ['FILES_UPLOAD_PATH'];

REQUIRED_ENV_VARS.forEach(name => {
  requiredEnv(name);
});

const baseUploadPath = requiredEnv('FILES_UPLOAD_PATH');

export const config = {
  paths: {
    uploadTempDir: path.resolve(baseUploadPath, 'uploads'),
  },
};
