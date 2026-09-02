/**
 * Stub for Google Drive composition root so Jest never loads ESM `mime`
 * via google-drive.service.ts. Tests that need Drive behaviour should
 * still mock uploadFile / getImageById on this object.
 */
export const googleDriveService = {
  uploadFile: async (): Promise<string> => 'mock-google-drive-file-id',
  getImageById: async (): Promise<never> => {
    throw new Error('googleDriveService.getImageById is not implemented in the test stub');
  },
};
