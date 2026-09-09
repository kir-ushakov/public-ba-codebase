/**
 * Stub for Google Drive composition root so Jest never instantiates the real
 * service (ESM `mime`). Specs can override uploadFile / getImageById.
 */
import { Result } from '../../src/shared/core/result.js';

export const googleDriveService = {
  uploadFile: jest.fn(async () => Result.ok('mock-google-drive-file-id')),
  getImageById: jest.fn(),
};
