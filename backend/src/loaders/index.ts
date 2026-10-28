import * as mongooseLoader from './mongoose.js';
import { startRedisSyncNotifications } from '../shared/infra/sync-signal/redis-sync-notifications.js';
//import * as ngrokLoader from './ngrok';

export async function bootstrap(client: string): Promise<void> {
  try {
    await mongooseLoader.connectToDb(client);
    //await ngrokLoader.establishIngress();
  } catch (err) {
    console.log(err);
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    startRedisSyncNotifications(redisUrl);
  }
}
