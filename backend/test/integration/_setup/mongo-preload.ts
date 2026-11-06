import { startInMemoryMongo } from './mongo-memory.js';

beforeAll(async () => {
  const testPath = (expect.getState().testPath ?? '').replace(/\\/g, '/');
  if (!testPath.includes('/integration/')) {
    return;
  }
  await startInMemoryMongo();
}, 120_000);
