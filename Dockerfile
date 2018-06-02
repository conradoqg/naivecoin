FROM node:carbon-alpine

VOLUME /naivecoin

WORKDIR /naivecoin

ENTRYPOINT node bin/naivecoin.js

EXPOSE 3001