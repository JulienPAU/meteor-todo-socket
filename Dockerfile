FROM node:20

RUN curl https://install.meteor.com/ | sh

WORKDIR /app

COPY . .

ENV METEOR_ALLOW_SUPERUSER=true

RUN meteor npm install

RUN meteor build --directory /build --server-only

WORKDIR /build/bundle/programs/server
RUN npm install

ENV PORT=3000
ENV ROOT_URL=http://localhost:3000
ENV MONGO_URL=mongodb://localhost:27017/meteor

EXPOSE 3000

WORKDIR /build/bundle
CMD ["node", "main.js"]
