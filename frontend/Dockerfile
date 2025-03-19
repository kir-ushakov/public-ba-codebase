FROM node:20

COPY . /usr/src/app

WORKDIR /usr/src/app

RUN npm install --verbose

CMD npm run $BUILD_MODE
