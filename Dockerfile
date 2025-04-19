FROM node:20

RUN curl https://install.meteor.com/ | sh

WORKDIR /app

COPY . .

ENV METEOR_ALLOW_SUPERUSER=true

RUN meteor npm install

EXPOSE 3000

CMD ["meteor", "run", "--port", "3000", "--production"]
