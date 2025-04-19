FROM zodern/meteor:latest
WORKDIR /app
COPY . .
RUN meteor npm install
EXPOSE 3000
CMD ["meteor", "run", "--port", "3000", "--production"]
