FROM node:lts-alpine
WORKDIR /app
RUN apk update && apk upgrade && \
    apk add --no-cache bash git
COPY package.json .
RUN yarn
COPY . .
EXPOSE 8090
ENTRYPOINT yarn start