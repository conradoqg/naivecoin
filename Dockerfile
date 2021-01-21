FROM node:6

VOLUME /savulcoin

WORKDIR /savulcoin

ENTRYPOINT node bin/savulcoin.js

EXPOSE 3001