// test/integration/setup/mongo-memory.ts
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryReplSet | null = null;
let uri: string | null = null;

export async function startInMemoryMongo(): Promise<string> {
  if (!mongoServer) {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: {
        count: 1,
        storageEngine: 'wiredTiger',
        args: ['--wiredTigerCacheSizeGB', '0.25'],
      },
    });
    uri = mongoServer.getUri();
  }
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri ?? '');
  }
  if (!uri) {
    throw new Error('in-memory replica set did not return a uri');
  }
  return uri;
}

export async function stopInMemoryMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  await Promise.all(Object.values(collections).map(col => col.deleteMany({})));
}
