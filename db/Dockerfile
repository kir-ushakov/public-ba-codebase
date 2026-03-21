FROM mongo:7.0

COPY --chown=mongodb:mongodb ./init-db.d/seed.js /docker-entrypoint-initdb.d/
RUN chmod a-w /docker-entrypoint-initdb.d/seed.js
