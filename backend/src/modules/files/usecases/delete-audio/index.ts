import { DeleteAudioController } from './delete-audio.controller.js';
import { DeleteAudioUsecase } from './delete-audio.usecase.js';
import { localAudioStorage } from '../../services/_index.js';

const deleteAudioUsecase = new DeleteAudioUsecase(localAudioStorage);
const deleteAudioController = new DeleteAudioController(deleteAudioUsecase);

export { deleteAudioController };
