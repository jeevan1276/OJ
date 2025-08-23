FROM node:18

WORKDIR /app
RUN apt-get update && apt-get install -y openjdk-17-jdk gcc g++
COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8000
CMD ["npm", "start"] 