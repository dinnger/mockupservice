# Generated {{ now }}
FROM node:20.11.0-slim
WORKDIR /app

# Preinstalacion


# Dependencias
RUN npm i jsonwebtoken@9.0.2
RUN npm i ajv@8.16.0
RUN npm i ajv-formats@3.0.1
RUN npm i ajv-i18n@4.2.0
RUN npm i ajv-errors@3.0.0
RUN npm i fast-xml-parser@4.4.0
RUN npm i pg@8.12.0
RUN npm i pg-hstore@2.3.4

RUN npm i typescript

COPY .env.base /app/.env
COPY _flows /app/_flows
COPY server /app/server
COPY horizonServer /app/horizonServer
COPY horizonShare /app/horizonShare
COPY horizonWorker /app/horizonWorker

EXPOSE 3000
CMD [ "tsx","./server/app.ts" ]
