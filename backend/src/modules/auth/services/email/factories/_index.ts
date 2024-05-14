import { SimpleMailFactory } from './simple-mail.factory';
import { HalloweenMailFactory } from './halloween-mail.factory';
import { ChristmasMailFactory } from './christmas-mail.factory';

const simpleMailFactory = new SimpleMailFactory();
const halloweenMailFactory = new HalloweenMailFactory();
const christmasMailFactory = new ChristmasMailFactory();

export { simpleMailFactory, halloweenMailFactory, christmasMailFactory };
