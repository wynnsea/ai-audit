# syntax=docker/dockerfile:1

# ---------- dependencies ----------
FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# cache npm disimpan antar build: kalau package berubah, yang di-download cuma yang baru
RUN --mount=type=cache,target=/root/.npm npm ci

# ---------- build ----------
FROM node:24-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# next.config.ts (termasuk rewrites /api → Go) dibaca saat build dan dibekukan ke hasil build,
# jadi alamat Go harus diberikan di sini, bukan saat container jalan
ARG API_URL=http://api:8081
ENV API_URL=$API_URL
ENV NEXT_TELEMETRY_DISABLED=1
# cache build Next (.next/cache) disimpan antar build supaya compile ulang lebih cepat
RUN --mount=type=cache,target=/app/.next/cache npm run build

# ---------- runtime ----------
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# output "standalone" berisi server.js + node_modules yang benar-benar dipakai saja;
# public/ dan .next/static tidak ikut otomatis, jadi disalin manual
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node
EXPOSE 3000
CMD ["node", "server.js"]
