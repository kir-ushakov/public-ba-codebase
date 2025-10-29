FROM node:20

WORKDIR /usr/src/app

# Copy contracts package first
COPY contracts/ ../contracts/
WORKDIR /usr/src/contracts
RUN npm install
RUN npm run build

# Build frontend
WORKDIR /usr/src/app
COPY frontend/ .
RUN npm install --verbose

CMD npm run $BUILD_MODE
