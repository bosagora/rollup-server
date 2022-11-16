# From Agora Runner
FROM node:14.15.4-alpine3.12
RUN apk add --no-cache git py-pip alpine-sdk \
    bash autoconf libtool automake

WORKDIR /rollup/

ADD . /rollup/
RUN npm ci --prefix /rollup/ && npm run build --prefix /rollup/

# Starts a node process, which compiles TS and watches `src` for changes
ENTRYPOINT [ "/rollup/docker/entrypoint.sh" ]
