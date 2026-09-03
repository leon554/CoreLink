# ---- Build stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci

ARG VITE_REACT_APP_BACKEND_BASEURL
ENV VITE_REACT_APP_BACKEND_BASEURL=$VITE_REACT_APP_BACKEND_BASEURL

# Copy source and build
COPY . .
RUN npm run build

# ---- Production stage ----
FROM nginx:1.27-alpine

# Remove default nginx static content
RUN rm -rf /usr/share/nginx/html/*

# Copy built assets from the build stage
# CRA outputs to /app/build, Vite outputs to /app/dist — adjust if needed
COPY --from=build /app/dist /usr/share/nginx/html

# Optional: custom nginx config (e.g. for SPA client-side routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]