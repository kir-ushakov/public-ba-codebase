/**
 * Jest setup file to configure environment variables for tests.
 * Loaded before test files via jest.config.ts setupFiles.
 */
process.env.NODE_ENV = 'test';
process.env.AUTHENTICATION_STRATEGY = 'JWT';
process.env.JWT_SECRET = 'test-jwt-secret-min-32-chars-long!!';
process.env.SESSION_SECRET = 'test-session-secret';
process.env.FILES_UPLOAD_PATH = './test-uploads';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.GOOGLE_OAUTH_CALLBACK = 'http://localhost/callback';
process.env.SENDGRID_API_KEY = 'SG.test-sendgrid-api-key';
process.env.MAILGUN_API_KEY = 'test-mailgun-api-key';
process.env.OPEN_AI_API_KEY = 'test-openai-api-key';
process.env.SLACK_SIGNING_SECRET = 'test-slack-signing-secret';
