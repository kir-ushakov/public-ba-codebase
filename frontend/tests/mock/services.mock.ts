import { TINY_TRANSPARENT_PNG_DATA_URL } from './tiny-png-data-url.mock';

export const mockCameraService = {
  takePicture: jest.fn().mockResolvedValue(TINY_TRANSPARENT_PNG_DATA_URL),
};

export const mockFetchService = {
  fetchBlob: jest.fn().mockImplementation(async (url: string) => {
    const base64 = TINY_TRANSPARENT_PNG_DATA_URL.split(',')[1];
    return new Blob([Buffer.from(base64, 'base64')], { type: 'image/png' });
  }),
};

export const mockImageDbService = {
  putImage: jest.fn().mockResolvedValue(undefined),
  getImage: jest.fn().mockResolvedValue({ id: 'mock-image-id', uploaded: false }),
  getAllUnuploadedImages: jest.fn().mockResolvedValue([]),
  updateImage: jest.fn().mockResolvedValue(undefined),
};

export const mockImageOptimizerService = {
  optimizeImage: jest.fn().mockImplementation(async (blob: Blob) => blob),
};

export const mockImageUploaderService = {
  uploadImageBlob: jest.fn().mockResolvedValue({ url: 'https://example.com/image' }),
};