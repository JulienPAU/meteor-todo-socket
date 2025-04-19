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

RUN apt-get update && apt-get install -y dnsutils

COPY start.sh /start.sh
RUN chmod +x /start.sh

WORKDIR /build/bundle

EXPOSE 8080

CMD ["/start.sh"]
