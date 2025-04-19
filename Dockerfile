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
ENV MONGO_URL=mongodb://127.0.0.1:27017/meteor

RUN apt-get update && apt-get install -y gnupg curl && \
    curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
    gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    --dearmor && \
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/7.0 main" | \
    tee /etc/apt/sources.list.d/mongodb-org-7.0.list && \
    apt-get update && \
    apt-get install -y mongodb-org

RUN mkdir -p /data/db && \
    chown -R 1000:1000 /data/db

COPY <<EOF /start.sh
#!/bin/bash
mongod --fork --logpath /var/log/mongodb.log
sleep 5
export ROOT_URL=\${ROOT_URL:-http://localhost:3000}
cd /build/bundle
node main.js
EOF

RUN chmod +x /start.sh

EXPOSE 3000

CMD ["/start.sh"]
