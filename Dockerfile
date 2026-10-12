# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# nginx-unprivileged: listens on 8080 and runs as non-root (works with restricted PodSecurity).
FROM nginxinc/nginx-unprivileged:1.30-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker/40-env-js.sh /docker-entrypoint.d/40-env-js.sh
COPY --from=build /src/dist /usr/share/nginx/html
EXPOSE 8080
