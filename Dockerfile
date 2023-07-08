FROM node:latest

WORKDIR /app/server
COPY ./server/package.json ./
RUN yarn
COPY ./server/ .

WORKDIR /app/ui
COPY ./ui/package.json ./
RUN yarn
COPY ./ui/ .
RUN yarn build

RUN cp -r /app/ui/dist /app/server/public

WORKDIR /app/server
RUN rm -rf /app/ui
ENV WEB_SERVER_PORT=3695
ENV DATABASE_PATH='/data/database.db'
ENV PUBLIC_FOLDER='/data/public/'
ENV NODE_ENV='production'

CMD [ "yarn","start" ]