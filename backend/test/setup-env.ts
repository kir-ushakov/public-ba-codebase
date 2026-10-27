/**
 * Jest setup file to configure environment variables for tests.
 * Loaded before test files via jest.config.ts setupFiles.
 */
import fs from 'fs';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!';
// One directory per worker. Suites share a process-wide multer dest, and one
// spec replaces that directory with a file to test the write failure.
const uploadRoot = path.resolve(
  process.cwd(),
  'test-uploads',
  `worker-${process.env.JEST_WORKER_ID ?? '0'}`,
);
process.env.FILES_UPLOAD_PATH = uploadRoot;
// eslint-disable-next-line security/detect-non-literal-fs-filename -- per-worker test upload dir
fs.mkdirSync(path.join(uploadRoot, 'tmp'), { recursive: true });
// eslint-disable-next-line security/detect-non-literal-fs-filename -- per-worker test upload dir
fs.mkdirSync(path.join(uploadRoot, 'uploads'), { recursive: true });
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_OAUTH_CALLBACK = 'http://localhost/callback';
process.env.SENDGRID_API_KEY = 'SG.test-sendgrid-api-key';
process.env.MAILGUN_API_KEY = 'test-mailgun-api-key';
process.env.OPEN_AI_API_KEY = 'test-openai-api-key';
process.env.SLACK_SIGNING_SECRET = 'test-slack-signing-secret';
