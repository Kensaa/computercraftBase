FROM node:latest as build_env

WORKDIR /app/server
COPY ./server/package.json ./
RUN yarn
COPY ./server/ .
RUN yarn build
RUN yarn install --production

WORKDIR /app/ui
COPY ./ui/package.json ./
RUN yarn
COPY ./ui/ .
RUN yarn build

FROM gcr.io/distroless/nodejs20-debian12
COPY --from=build_env /app/server /app/server
COPY --from=build_env /app/ui/dist /app/server/public
WORKDIR /app/server
ENV WEB_SERVER_PORT=3695
ENV DATABASE_PATH='/data/database.db'

CMD ["dist/server.js"]