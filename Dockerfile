# build the front end
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci

COPY frontend .

RUN npm run build

# serve it with nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
