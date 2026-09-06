FROM node:24-alpine

# Install FFmpeg 
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN mkdir -p uploads temp

EXPOSE 5000

CMD ["npm", "run", "dev"] 