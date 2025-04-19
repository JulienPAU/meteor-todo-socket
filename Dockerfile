FROM node:20 AS builder

RUN curl https://install.meteor.com/ | sh

WORKDIR /app
COPY . .

RUN meteor npm install

RUN meteor build ../output --directory --server-only

FROM node:20

WORKDIR /app

COPY --from=builder /output/bundle ./bundle

WORKDIR /app/bundle/programs/server
RUN npm install

ENV PORT=3000
EXPOSE 3000

WORKDIR /app/bundle
CMD ["node", "main.js"]
