import { UploadAudioController } from './upload-audio.controller.js';
import { UploadAudioUsecase } from './upload-audio.usecase.js';
import { localAudioStorage } from '../../services/_index.js';

const uploadAudioUsecase = new UploadAudioUsecase(localAudioStorage);
const uploadAudioController = new UploadAudioController(uploadAudioUsecase);

export { uploadAudioController };
