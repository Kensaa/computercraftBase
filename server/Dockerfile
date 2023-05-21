FROM node:19

WORKDIR /app
COPY package.json ./
RUN yarn install

COPY . .

ENV WEB_SERVER_PORT=3695
ENV DATABASE_PATH='/data/database.db'
ENV PUBLIC_FOLDER='/data/public/'
ENV NODE_ENV='production'

CMD [ "yarn","start" ]