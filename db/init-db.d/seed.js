db.init.drop();
db.init.insert({ inti: true });

const MONGO_INITDB_ROOT_USERNAME=process.env.MONGO_INITDB_ROOT_USERNAME
const MONGO_INITDB_ROOT_PASSWORD=process.env.MONGO_INITDB_ROOT_PASSWORD
const MONGO_INITDB_DATABASE=process.env.MONGO_INITDB_DATABASE

db.createUser(
  {
    user: MONGO_INITDB_ROOT_USERNAME,
    pwd: MONGO_INITDB_ROOT_PASSWORD,
    roles: [
      {
        role: "readWrite",
        db: MONGO_INITDB_DATABASE
      }
    ]
  }
);
