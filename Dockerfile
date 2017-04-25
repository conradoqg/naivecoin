FROM node:6

VOLUME /naivecoin

WORKDIR /naivecoin

ENTRYPOINT node bin/naivecoin.js

EXPOSE 3001