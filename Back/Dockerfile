# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS deps

COPY package.json package-lock.json ./

# Cache de npm + timeouts largos (Prisma descarga engines en postinstall y parece "colgado")
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm ci --no-audit --fund=false --loglevel=info

FROM deps AS builder

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4000

COPY package.json package-lock.json ./

# Producción + Prisma CLI (migrate deploy en entrypoint.sh)
RUN --mount=type=cache,target=/root/.npm \
    npm config set fetch-timeout 300000 && \
    npm config set fetch-retries 5 && \
    npm ci --omit=dev --no-audit --fund=false --loglevel=info && \
    npm install prisma@5.22.0 --no-save --no-audit --loglevel=info

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 4000

ENTRYPOINT ["./entrypoint.sh"]
