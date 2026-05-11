# PWA Angular Dockerfile
FROM node:20 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Patch @base-org/account to fix 'import ... with type: json' syntax not supported by webpack
RUN if [ -f node_modules/@base-org/account/dist/core/constants.js ]; then \
      head -1 node_modules/@base-org/account/dist/core/constants.js && \
      sed -i '1s/.*/const pkg = { version: "0.0.0" };/' node_modules/@base-org/account/dist/core/constants.js && \
      echo "Patched constants.js:" && head -1 node_modules/@base-org/account/dist/core/constants.js; \
    fi
RUN npx ng build --configuration production

# Servidor Nginx para servir Angular
FROM nginx:stable-alpine
COPY --from=build /app/dist/winx-oracle-pwa /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
