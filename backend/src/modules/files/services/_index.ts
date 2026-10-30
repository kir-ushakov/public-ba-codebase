import { config } from '../../../config/index.js';
import { ImageResizeService } from './image-resize.service.js';
import { LocalImageStorage } from './image-storage/local-image-storage.service.js';

const imageResizeService = new ImageResizeService();
const localImageStorage = new LocalImageStorage(config.paths.imagesDir);

export { imageResizeService, localImageStorage };
