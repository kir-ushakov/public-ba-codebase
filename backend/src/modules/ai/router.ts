import { Router } from 'express';
import { speechToTextController } from './usecases/speech-to-text/index.js';
import { asyncHandler } from '../../shared/core/async-handler.function.js';

const aIRouter: Router = Router();

aIRouter.post('/speech-to-text', asyncHandler(speechToTextController.execute));

export { aIRouter };
