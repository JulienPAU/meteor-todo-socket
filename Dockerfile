FROM node:20

RUN curl https://install.meteor.com/ | sh

WORKDIR /app

COPY . .

ENV METEOR_ALLOW_SUPERUSER=true

RUN meteor npm install

RUN meteor build --directory /build --server-only

WORKDIR /build/bundle/programs/server
RUN npm install

ENV PORT=8080

WORKDIR /build/bundle

EXPOSE 8080

CMD ["node", "main.js"]
