#!/usr/bin/env sh
set -e
# Named volume mounts as root:root; runtime user is `node` → multer cannot write without this.
# Path comes from compose (`FILES_UPLOAD_PATH`); both the dev image (/app/backend) and
# Dockerfile.prod (/usr/src/app) mount the volume at that env path, not at WORKDIR.
upload_root="${FILES_UPLOAD_PATH:-/app/backend/files}"
mkdir -p "$upload_root/tmp" "$upload_root/uploads"
chown -R node:node "$upload_root"
exec gosu node "$@"
