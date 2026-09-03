FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

ARG VITE_REACT_APP_BACKEND_BASEURL
ENV VITE_REACT_APP_BACKEND_BASEURL=$VITE_REACT_APP_BACKEND_BASEURL

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

RUN rm -rf /usr/share/nginx/html/*

COPY --from=build /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]