FROM node:18

WORKDIR /app

RUN apt-get update -y \
    && apt-get install -y --no-install-recommends \
       openjdk-17-jdk \
       gcc \
       g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 8000
CMD ["npm", "start"]
