import { Router } from 'express';
import { speechToTextController } from './usecases/speech-to-text';

const aIRouter: Router = Router();

aIRouter.post('/speech-to-text', (req, res, next) =>
  speechToTextController.execute(req, res, next),
);

export { aIRouter };
