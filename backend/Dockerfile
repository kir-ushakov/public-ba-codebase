FROM node:20

WORKDIR /usr/src/app

# Copy contracts package first
COPY contracts/ ../contracts/
WORKDIR /usr/src/contracts
RUN npm install
RUN npm run build

# Build backend
WORKDIR /usr/src/app
COPY backend/package*.json ./
RUN npm install --verbose
RUN npm install -g nodemon

COPY backend/ .

CMD ["npm", "run", "dev"]
