import * as dotenv from 'dotenv';
import https from 'https';
import fs from 'fs';
import { app } from './src/app.js';

dotenv.config();

const port = process.env.PORT;
const crtPath = process.env.CRT_PATH;
const keyPath = process.env.KEY_PATH;
const caBandlePath = process.env.CA_BANDLE_PATH;

const httpsOptions: https.ServerOptions = {
  cert: fs.readFileSync(crtPath),
  key: fs.readFileSync(keyPath),
};

if (caBandlePath) {
  httpsOptions.ca = fs.readFileSync(caBandlePath);
}

app.set('port', port);
const server = https.createServer(httpsOptions, app);
server.listen(port);
