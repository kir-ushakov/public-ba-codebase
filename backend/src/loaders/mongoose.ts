import mongoose, { Mongoose } from "mongoose";

const DB_PORT = process.env.DB_PORT;
const DB_CONTAINER = process.env.DB_CONTAINER
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD;

const DB_URI = `mongodb://${DB_USER}:${DB_PASSWORD}@${DB_CONTAINER}:${DB_PORT}/ba?authSource=admin`;

export function connectToDb(client):Promise<Mongoose>  {
  return new Promise<Mongoose>((resolve, reject) => {
    mongoose.connect(DB_URI).then((connection) => {
      console.log(`Database connection established successfully for Client: ${client}`);
      resolve(connection);
    }).catch((err) => {
      console.log(`Error occurred while connection with DB for for Client: ${client}`);
      console.log("DB_URI: " + DB_URI);
      reject(err);
    });
  });
}
