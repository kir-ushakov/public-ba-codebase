import express, { Express, Request, Response } from 'express';
import multer from 'multer';
import { UploadImageController } from '../../../src/modules/files/usecases/upload-image/upload-image.controller.js';
import { UploadImageUsecase } from '../../../src/modules/files/usecases/upload-image/upload-image.usecase.js';
import { ImageRepoService } from '../../../src/shared/repo/image-repo.service.js';
import { ImageResizeService } from '../../../src/modules/files/services/image-resize.service.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';

type MockGoogleDriveService = {
  uploadFile: jest.Mock;
};

export const TEST_USER_ID = 'test-user-1';

/**
 * Build Express app wired to the real controller + repo for upload-image integration tests
 */
export function buildUploadImageTestApp(): {
  app: Express;
  uploadImageController: UploadImageController;
  imageRepoService: ImageRepoService;
  googleDriveService: MockGoogleDriveService;
} {

  // Mock Google Drive service (no real network calls - partial mock for testing)
  const googleDriveService = {
    uploadFile: jest.fn(),
  } as any;

  // Use real ImageResizeService for proper integration testing
  const imageResizeService = new ImageResizeService();

  const imageRepoService = new ImageRepoService(models);
  const uploadImageUseCase = new UploadImageUsecase(
    googleDriveService,
    imageRepoService,
    imageResizeService,
  );
  const uploadImageController = new UploadImageController(uploadImageUseCase);

  const app = express();
  
  // Configure multer for file uploads
  const upload = multer({ dest: 'test/integration/files/uploads/' });

  // Fake auth middleware: sets req.user to a complete test user object
  app.use((req: Request, _res: Response, next) => {
    (req as any).user = {
      _id: TEST_USER_ID,
      username: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      googleId: 'test-google-id',
      googleRefreshToken: 'test-refresh-token',
      googleAccessToken: 'test-access-token',
    };
    next();
  });

  // Mount the controller on POST /api/files/upload-image
  app.post('/api/files/upload-image', upload.single('file'), async (req: Request, res: Response) => {
    try {
      // BaseController has a public execute method that calls executeImpl
      if (typeof (uploadImageController as any).execute === 'function') {
        await (uploadImageController as any).execute(req, res);
      } else {
        // Fallback to executeImpl if execute is not available
        await (uploadImageController as any).executeImpl(req, res);
      }
    } catch (err) {
      console.error('Controller threw:', err);
      res.status(500).json({ error: String(err) });
    }
  });

  return { app, uploadImageController, imageRepoService, googleDriveService };
}

