import { AudioPreprocessorService } from '../../../../shared/services/audio/audio-preprocessor.service.js';
import { LoggerService } from '../../../../shared/services/logger/logger.service.js';
import { OpenAIService } from '../../services/open-ai.service.js';
import { SpeechToTextController } from './speech-to-text.controller.js';
import { SpeechToText } from './speech-to-text.usecase.js';

const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const audioPreprocessorService = new AudioPreprocessorService();
const openAIService = new OpenAIService(OPEN_AI_API_KEY, audioPreprocessorService);
const speechToText = new SpeechToText(openAIService);
const loggerService = new LoggerService();
const speechToTextController = new SpeechToTextController(speechToText, loggerService);

export { speechToTextController };
