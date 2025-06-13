import { Router } from 'express';
import { speechToTextController } from './usecases/speech-to-text/index.js';
import { asyncHandler } from '../../shared/core/async-handler.function.js';
import multer from 'multer';

const aIRouter: Router = Router();

const upload = multer();

aIRouter.post(
  '/speech-to-text',
  upload.single('file'),
  asyncHandler(speechToTextController.execute.bind(speechToTextController)),
);

export { aIRouter };
