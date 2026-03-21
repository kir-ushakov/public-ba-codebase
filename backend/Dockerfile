FROM node:20

WORKDIR /app

# Copy contracts and build
COPY contracts/ ./contracts/
WORKDIR /app/contracts
RUN npm install && npm run build

# Copy backend and install dependencies (including linked contracts)
WORKDIR /app/backend
COPY backend/ .
RUN npm install --verbose
RUN npm install -g nodemon

# Drop root privileges for runtime
RUN chown -R node:node /app
USER node

CMD ["npm", "run", "dev"]
