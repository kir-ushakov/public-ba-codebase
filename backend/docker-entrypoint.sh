#!/usr/bin/env sh
set -e
# Named volume mounts as root:root; runtime user is `node` → multer cannot write without this.
mkdir -p /app/backend/files/tmp /app/backend/files/uploads
chown -R node:node /app/backend/files
exec gosu node "$@"
