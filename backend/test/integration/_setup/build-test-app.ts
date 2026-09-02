import { Application } from 'express';
import { createApp } from '../../../src/create-app.js';

/**
 * Production Express app (real routers, Passport JWT, multer) without Mongo bootstrap.
 * Call after startInMemoryMongo() in beforeAll.
 */
export function buildTestApp(): { app: Application } {
  return { app: createApp() };
}
