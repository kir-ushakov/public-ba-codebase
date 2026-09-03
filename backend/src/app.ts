import { createApp } from './create-app.js';
import * as loaders from './loaders/index.js';

export const app = createApp();

loaders.bootstrap('Node Backend App');
