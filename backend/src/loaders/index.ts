import * as mongooseLoader from './mongoose.js';
//import * as ngrokLoader from './ngrok';

export async function bootstrap(client: string): Promise<void> {
  try {
    await mongooseLoader.connectToDb(client);
    //await ngrokLoader.establishIngress();
  } catch (err) {
    console.log(err);
  }
}
