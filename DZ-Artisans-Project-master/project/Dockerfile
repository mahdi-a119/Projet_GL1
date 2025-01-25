FROM node:20.18.0

WORKDIR /project

COPY package.json /project/package.json

RUN npm install -g nodemon
RUN npm install --omit=dev 


COPY . .

EXPOSE 4000

CMD ["nodemon","index.js","start" , "server.js"]




