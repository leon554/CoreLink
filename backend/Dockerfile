# ---- Base ----
FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM base AS production

ENV NODE_ENV=production

USER node

COPY --chown=node:node --from=deps /app/node_modules ./node_modules
COPY --chown=node:node . .

EXPOSE 8080

CMD ["node", "server.js"]