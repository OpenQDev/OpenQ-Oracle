FROM node:12
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "node", "server.js" ]

# docker stop $(docker ps -a -q)
# docker rm $(docker ps -a -q)
# docker build -t openq:latest .
# docker run -p 8090:8090 --env WALLET_KEY=0xa30632f84ab7927462c023d0f19a0982157935d7e7e936c9823f6f9b511f4526 openq:latest