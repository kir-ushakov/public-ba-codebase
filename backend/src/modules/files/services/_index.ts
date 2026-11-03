import { config } from '../../../config/index.js';
import { ImageResizeService } from './image-resize.service.js';
import { LocalImageStorage } from './image-storage/local-image-storage.service.js';
import { LocalAudioStorage } from './audio-storage/local-audio-storage.service.js';

const imageResizeService = new ImageResizeService();
const localImageStorage = new LocalImageStorage(config.paths.imagesDir);
const localAudioStorage = new LocalAudioStorage(config.paths.audioDir);

export { imageResizeService, localImageStorage, localAudioStorage };
