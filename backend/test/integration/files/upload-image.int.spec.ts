import request from 'supertest';
import path from 'path';
import { promises as fsp } from 'fs';
import { Express } from 'express';
import { startInMemoryMongo, stopInMemoryMongo, clearDatabase } from '../_setup/mongo-memory.js';
import { buildUploadImageTestApp, TEST_USER_ID } from './test-app.js';
import { models } from '../../../src/shared/infra/database/mongodb/index.js';

describe('Integration: UploadImage (Controller -> UseCase -> Repo -> MongoDB)', () => {
  let app: Express;
  let googleDriveService: { uploadFile: jest.Mock };
  const TEST_IMAGE_PATH = path.join(process.cwd(), 'test/integration/sync/assets/test-img.jpg');

  beforeAll(async () => {
    await startInMemoryMongo();
    
    // Build the express app wired to the controller
    const built = buildUploadImageTestApp();
    app = built.app;
    googleDriveService = built.googleDriveService;
  }, 30_000);

  afterAll(async () => {
    await stopInMemoryMongo();
    // Clean up uploads directory
    await cleanupUploadsDirectory();
  });

  beforeEach(async () => {
    // Clear DB between tests
    await clearDatabase();
    // Reset mocks
    jest.clearAllMocks();
  });

  it('happy path: should upload image and persist metadata to DB', async () => {
    const imageId = 'image-123';
    const mockGoogleDriveFileId = 'google-drive-file-id-abc';
    
    // Mock Google Drive upload success
    googleDriveService.uploadFile.mockResolvedValue(mockGoogleDriveFileId);

    const res = await request(app)
      .post('/api/files/upload-image')
      .field('imageId', imageId)
      .attach('file', TEST_IMAGE_PATH)
      .set('Accept', 'application/json');

    expect(res.status).toBe(200);
    expect(googleDriveService.uploadFile).toHaveBeenCalledTimes(1);

    // Validate image metadata persisted in DB
    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).not.toBeNull();
    expect(persistedImage.imageId).toBe(imageId);
    expect(persistedImage.fileId).toBe(mockGoogleDriveFileId);
    expect(persistedImage.userId).toBe(TEST_USER_ID);
    expect(persistedImage.storageType).toBe('googleDrive');
  });

  it('should reject unsupported file types', async () => {
    const imageId = 'image-invalid';
    const uploadsDir = path.join(process.cwd(), 'test/integration/files/uploads');
    await fsp.mkdir(uploadsDir, { recursive: true });
    const invalidFilePath = path.join(uploadsDir, 'test-file.txt');
    
    // Create invalid file type
    await fsp.writeFile(invalidFilePath, 'This is a text file');

    const res = await request(app)
      .post('/api/files/upload-image')
      .field('imageId', imageId)
      .attach('file', invalidFilePath)
      .set('Accept', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message');

    // Verify no image was saved to DB
    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toBeNull();
  });

  it('should handle Google Drive upload failures', async () => {
    const imageId = 'image-error';
    
    // Mock Google Drive upload failure
    googleDriveService.uploadFile.mockRejectedValue(new Error('Google Drive API error'));

    const res = await request(app)
      .post('/api/files/upload-image')
      .field('imageId', imageId)
      .attach('file', TEST_IMAGE_PATH)
      .set('Accept', 'application/json');

    expect(res.status).toBe(502); // BadGateway for external service failure
    expect(res.body).toHaveProperty('message');

    // Verify no image was saved to DB
    const persistedImage = await models.ImageModel.findOne({ imageId }).lean();
    expect(persistedImage).toBeNull();
  });
});

// Helper functions
async function cleanupUploadsDirectory() {
  const uploadsDir = path.join(process.cwd(), 'test/integration/files/uploads');
  try {
    await fsp.rm(uploadsDir, { recursive: true, force: true });
  } catch (err) {
    // Ignore cleanup errors
  }
}
