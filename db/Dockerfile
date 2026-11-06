# Official image entrypoint expects root for first-run chown of /data/db; adding USER here breaks named volumes.
FROM mongo:8.2

COPY --chmod=444 --chown=root:root ./init-db.d/seed.js /docker-entrypoint-initdb.d/
COPY --chmod=755 ./entrypoint.sh /usr/local/bin/ba-mongo-entrypoint.sh
COPY --chmod=755 ./ready.sh /usr/local/bin/ba-mongo-ready.sh

ENTRYPOINT ["ba-mongo-entrypoint.sh"]
CMD ["mongod"]
