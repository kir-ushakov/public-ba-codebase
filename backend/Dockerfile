FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --verbose
RUN npm install -g nodemon

COPY . .

CMD ["npm", "run", "dev"]
