FROM node:20

WORKDIR /app

# Native deps for sharp (libvips) + entrypoint helper (gosu)
RUN apt-get update \
  && apt-get install -y --no-install-recommends libvips42 gosu \
  && rm -rf /var/lib/apt/lists/*

# Copy contracts and build
COPY contracts/ ./contracts/
WORKDIR /app/contracts
RUN npm install && npm run build

# Copy backend and install dependencies (including linked contracts)
WORKDIR /app/backend
COPY backend/ .
RUN npm install --verbose
RUN npm install -g nodemon

RUN chown -R node:node /app

COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Strip CRLF if the file was saved on Windows (fixes: /usr/bin/env: 'sh\r': No such file)
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh

# Root only for entrypoint (chown bind-mounted /app/backend/files); CMD runs as node via gosu in docker-entrypoint.sh.
USER root
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]
