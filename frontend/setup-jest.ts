import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';
import 'fake-indexeddb/auto';

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
}

setupZoneTestEnv();
