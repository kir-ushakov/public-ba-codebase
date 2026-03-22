# Official image entrypoint expects root for first-run chown of /data/db; adding USER here breaks named volumes.
FROM mongo:8.2

COPY --chmod=444 --chown=root:root ./init-db.d/seed.js /docker-entrypoint-initdb.d/
