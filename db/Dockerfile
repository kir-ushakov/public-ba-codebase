# Official mongo entrypoint must start as root to chown /data/db, then runs mongod as user mongodb (gosu). USER mongodb here breaks first init on named volumes.
FROM mongo:7.0 # NOSONAR

COPY --chmod=444 --chown=root:root ./init-db.d/seed.js /docker-entrypoint-initdb.d/
