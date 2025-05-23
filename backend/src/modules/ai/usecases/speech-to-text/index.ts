import { OpenAIService } from '../../services/open-ai.service';
import { SpeechToTextController } from './speech-to-text.controller';
import { SpeechToText } from './speech-to-text.usecase';

const OPEN_AI_API_KEY = process.env.OPEN_AI_API_KEY;
const openAIService = new OpenAIService(OPEN_AI_API_KEY);
const speechToText = new SpeechToText(openAIService);
const speechToTextController = new SpeechToTextController(speechToText);

export { speechToTextController };
