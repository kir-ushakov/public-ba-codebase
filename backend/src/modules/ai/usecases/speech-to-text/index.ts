import { OpenAIService } from '../../services/open-ai.service.js';
import { SpeechToTextController } from './speech-to-text.controller.js';
import { SpeechToText } from './speech-to-text.usecase.js';

const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const openAIService = new OpenAIService(OPEN_AI_API_KEY);
const speechToText = new SpeechToText(openAIService);
const speechToTextController = new SpeechToTextController(speechToText);

export { speechToTextController };
