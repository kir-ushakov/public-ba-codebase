import { TINY_TRANSPARENT_PNG_DATA_URL } from './tiny-png-data-url.mock';
import { MOCK_IMAGE_ID } from '../constants/test-constants';

export const mockCameraService = {
  takePicture: jest.fn().mockResolvedValue(TINY_TRANSPARENT_PNG_DATA_URL),
};

export const mockFetchService = {
  fetchBlob: jest.fn().mockImplementation(async (url: string) => {
    const base64 = TINY_TRANSPARENT_PNG_DATA_URL.split(',')[1];
    return new Blob([Buffer.from(base64, 'base64')], { type: 'image/png' });
  }),
};

export const mockDatabaseService = {
  getDatabase: jest.fn().mockResolvedValue({
    put: jest.fn().mockResolvedValue(undefined),
    get: jest.fn().mockResolvedValue({ id: MOCK_IMAGE_ID, uploaded: false }),
    getAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(undefined),
    clear: jest.fn().mockResolvedValue(undefined),
  }),
  getDatabaseInfo: jest.fn().mockResolvedValue({ name: 'test-db', version: 1, stores: ['images'] }),
  clearAllData: jest.fn().mockResolvedValue(undefined),
};

export const mockImageOptimizerService = {
  optimizeImage: jest.fn().mockImplementation(async (blob: Blob) => blob),
};

export const mockImageUploaderService = {
  uploadImageBlob: jest.fn().mockResolvedValue({ url: 'https://example.com/image' }),
};

export const mockUuidGeneratorService = {
  generate: jest.fn(() => MOCK_IMAGE_ID),
};