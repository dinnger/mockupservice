# Generated {{ now }}
FROM node:20.11.0-slim
WORKDIR /app

# Preinstalacion
RUN apt-get update
RUN apt-get install wget -y
RUN apt-get install zip unzip -y
RUN wget https://download.oracle.com/otn_software/linux/instantclient/1919000/instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
RUN unzip instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
RUN rm instantclient-basiclite-linux.x64-19.19.0.0.0dbru.el9.zip
RUN apt-get install libaio1 -y
RUN apt-get install lsof -y

# Dependencias
RUN npm i jsonwebtoken@9.0.2
RUN npm i ajv@8.17.1
RUN npm i ajv-formats@3.0.1
RUN npm i ajv-i18n@4.2.0
RUN npm i ajv-errors@3.0.0
RUN npm i fast-xml-parser@4.4.0
RUN npm i pg@8.12.0
RUN npm i pg-hstore@2.3.4
RUN npm i oracledb@6.5.1

RUN npm i tsx -g

COPY env.base /app/.env
COPY _flows /app/_flows
COPY horizonShare /app/horizonShare
COPY horizonWorker /app/horizonWorker

EXPOSE 3000
CMD [ "tsx","horizonWorker/worker","flow","_flows/9.test-distelsa.mockupservice",3000]
