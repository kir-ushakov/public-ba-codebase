import { GetAudioController } from './get-audio.controller.js';
import { GetAudioUsecase } from './get-audio.usecase.js';
import { localAudioStorage } from '../../services/_index.js';

const getAudioUsecase = new GetAudioUsecase(localAudioStorage);
const getAudioController = new GetAudioController(getAudioUsecase);

export { getAudioController };
