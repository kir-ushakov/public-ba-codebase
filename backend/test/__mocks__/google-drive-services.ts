/**
 * Stub for Google Drive composition root so Jest never loads ESM `mime`
 * via google-drive.service.ts. Specs can override uploadFile / getImageById.
 */
export const googleDriveService = {
  uploadFile: jest.fn(async (): Promise<string> => 'mock-google-drive-file-id'),
  getImageById: jest.fn(),
};
