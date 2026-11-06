#!/bin/bash
# Exit 0 only when this node is PRIMARY. Otherwise initiate rs0 and ask Docker to retry.
# The member host is the compose service name so other containers discover the same node.
mongosh --quiet \
  --host 127.0.0.1 \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --eval '
    try {
      if (rs.status().myState === 1) {
        quit(0);
      }
    } catch (e) {}
    try {
      rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "db:27017" }] });
    } catch (e) {}
    quit(1);
  '
