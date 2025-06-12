FROM node:20

# Install ffmpeg
RUN apt-get update && \
    apt-get install -y ffmpeg && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --verbose
RUN npm install -g nodemon

COPY . .

CMD ["npm", "run", "dev"]
