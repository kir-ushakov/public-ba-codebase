// test/integration/setup/mongo-memory.ts
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer | null = null;

export async function startInMemoryMongo(): Promise<string> {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  // connect mongoose
  await mongoose.connect(uri, {
    // you can add options if your mongoose version requires it
  } as any);
  return uri;
}

export async function stopInMemoryMongo(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
}

export async function clearDatabase(): Promise<void> {
  const collections = mongoose.connection.collections;
  const promises = Object.keys(collections).map(key => collections[key].deleteMany({}));
  await Promise.all(promises);
}
