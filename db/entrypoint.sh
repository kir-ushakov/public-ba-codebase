#!/bin/bash
# One-member replica set so the app can commit a revision in a transaction.
# The key file stays on the data volume. A second Mongo node is not started here.
set -euo pipefail

KEYFILE=/data/db/mongo.key
mkdir -p /data/db
if [ ! -s "$KEYFILE" ]; then
  umask 077
  # base64 is in the official image; openssl is not.
  head -c 756 /dev/urandom | base64 > "$KEYFILE"
  chmod 400 "$KEYFILE"
  chown mongodb:mongodb "$KEYFILE"
fi

# The official image CMD is mongod. Replacing ENTRYPOINT drops that CMD,
# so an empty argument list must still start mongod.
if [ $# -eq 0 ] || [ "${1:-}" = "mongod" ]; then
  if [ "${1:-}" = "mongod" ]; then
    shift
  fi
  exec docker-entrypoint.sh mongod --replSet rs0 --keyFile "$KEYFILE" --bind_ip_all "$@"
fi

exec docker-entrypoint.sh "$@"
