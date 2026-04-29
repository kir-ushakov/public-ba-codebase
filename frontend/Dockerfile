FROM node:20

WORKDIR /usr/src/app

# Copy contracts package first
COPY contracts/ ../contracts/
WORKDIR /usr/src/contracts
RUN npm install --no-audit --no-fund
RUN npm run build

# Build frontend (do not rely on host node_modules — see repo .dockerignore)
WORKDIR /usr/src/app

# Install deps with good layer caching: only re-run when manifests change.
COPY frontend/package*.json ./
RUN npm install --no-audit --no-fund

# Copy the rest of the frontend sources.
COPY frontend/ .

RUN chown -R node:node /usr/src
USER node

CMD npm run $BUILD_MODE
