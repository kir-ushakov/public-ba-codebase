FROM mongo:7.0

COPY --chmod=444 --chown=root:root ./init-db.d/seed.js /docker-entrypoint-initdb.d/
