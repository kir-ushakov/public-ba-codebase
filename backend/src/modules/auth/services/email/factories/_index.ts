import { SimpleMailFactory } from './simple-mail.factory.js';
import { HalloweenMailFactory } from './halloween-mail.factory.js';
import { ChristmasMailFactory } from './christmas-mail.factory.js';

const simpleMailFactory = new SimpleMailFactory();
const halloweenMailFactory = new HalloweenMailFactory();
const christmasMailFactory = new ChristmasMailFactory();

export { simpleMailFactory, halloweenMailFactory, christmasMailFactory };
