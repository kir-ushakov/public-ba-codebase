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
  // Cert paths come from trusted server env, not request input.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  cert: fs.readFileSync(crtPath),
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  key: fs.readFileSync(keyPath),
};

if (caBandlePath) {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  httpsOptions.ca = fs.readFileSync(caBandlePath);
}

app.set('port', port);
const server = https.createServer(httpsOptions, app);
server.listen(port);

process.on('uncaughtException', function (error) {
  // TODO: use special log here
  console.log(' ===== Uncaught Exception Occurred ===== ');
  console.log(error);
  process.exit(1);
});

process.on('unhandledRejection', function (reason, _promise) {
  // TODO: use special log here
  console.log(' ===== Unhandled Rejection Occurred ===== ');
  console.log(reason);
  process.exit(1);
});
