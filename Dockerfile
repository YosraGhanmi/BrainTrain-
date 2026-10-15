# BrainTrain website: Next.js on Node 22, talking to the PostgreSQL container
# from docker-compose.yml. See DEPLOY_VPS.md.

# ---- Build -----------------------------------------------------------------
FROM node:22-bookworm-slim AS base
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

FROM base AS build
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
RUN npm run test:auth-config && npx tsc --noEmit && npm run build

# Prisma CLI has its own locked dependencies; no frontend/build tools here.
FROM base AS migrations
COPY deployment/migrations/package.json deployment/migrations/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --fetch-retries=5
COPY prisma ./prisma
COPY deployment/migrations/prisma.config.ts ./prisma.config.ts
USER node
CMD ["node", "node_modules/prisma/build/index.js", "migrate", "deploy"]

# ---- Run -------------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    UPLOADS_DIR=/app/uploads \
    NPM_CONFIG_UPDATE_NOTIFIER=false

COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Create writable runtime directories before dropping root privileges.
RUN mkdir -p /app/uploads /app/data && chown node:node /app/uploads /app/data

USER node
EXPOSE 3000

CMD ["node", "server.js"]
