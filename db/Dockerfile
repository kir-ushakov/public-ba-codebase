FROM mongo:7.0

COPY --chmod=444 --chown=mongodb:mongodb ./init-db.d/seed.js /docker-entrypoint-initdb.d/
