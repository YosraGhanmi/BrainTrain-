# BrainTrain website: Next.js on Node 22, talking to the PostgreSQL container
# from docker-compose.yml. See DEPLOY_VPS.md.

# ---- Build -----------------------------------------------------------------
FROM node:22-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# The build never connects to the database (pages are rendered on their first
# visit), but Prisma's config needs a value to load
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
# NEXT_PUBLIC_* values are written into the build, so they come in as build
# arguments (docker-compose.yml passes them from .env)
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_STRINGTUNE_DEV_TOKEN
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_STRINGTUNE_DEV_TOKEN=$NEXT_PUBLIC_STRINGTUNE_DEV_TOKEN

COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# Also runs `prisma generate` (postinstall)
RUN npm ci

COPY . .
RUN npm run build

# ---- Run -------------------------------------------------------------------
FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOADS_DIR=/app/uploads \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=build --chown=node:node /app ./
# data/ only receives the old JSON files for the one-time Firebase import
RUN mkdir -p /app/uploads /app/data && chown node:node /app/uploads /app/data

USER node
EXPOSE 3000

# Brings the database schema up to date, then starts the site
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]
