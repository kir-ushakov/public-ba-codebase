import { AudioPreprocessorService } from '../../../../shared/services/audio/audio-preprocessor.service.js';
import { LoggerService } from '../../../../shared/services/logger/logger.service.js';
import { OpenAIClientService } from '../../services/open-ai-client.service.js';
import { OpenAISpeechTranscriberService } from '../../services/open-ai-speech-transcriber.service.js';
import { SpeechToTextController } from './speech-to-text.controller.js';
import { SpeechToText } from './speech-to-text.usecase.js';

const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const openAIClientService = new OpenAIClientService(OPEN_AI_API_KEY);
const audioPreprocessorService = new AudioPreprocessorService();

const openAISpeechTranscriberService = new OpenAISpeechTranscriberService(
  openAIClientService,
  audioPreprocessorService,
);
const speechToText = new SpeechToText(openAISpeechTranscriberService);
const loggerService = new LoggerService();
const speechToTextController = new SpeechToTextController(speechToText, loggerService);

export { speechToTextController };
