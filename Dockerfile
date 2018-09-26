FROM node:6

VOLUME /concord

WORKDIR /concord

ENTRYPOINT node bin/concord.js

EXPOSE 3001
