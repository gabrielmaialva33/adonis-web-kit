# syntax=docker/dockerfile:1
#
# Multi-stage image to run the AdonisJS v7 app in a container (local/dev infra).
# Build: `docker compose build` (or `docker build -t adonis-web-kit .`).
#
ARG NODE_VERSION=24.13.0

# --- Base: node + pnpm + toolchain for native modules (argon2, better-sqlite3) ---
FROM node:${NODE_VERSION}-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=/pnpm:$PATH
RUN corepack enable && corepack prepare pnpm@11.22.0 --activate
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Build: install all deps and compile the app into ./build ---
FROM base AS build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# --- Production: only the compiled output + production deps ---
FROM base AS production
ENV NODE_ENV=production
# The compiled app already carries package.json + pnpm-lock.yaml; the
# pnpm-workspace.yaml is copied so `allowBuilds` lets the native modules build.
COPY --from=build /app/build ./
COPY pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
EXPOSE 3333
# Run pending migrations, then start the HTTP server (compiled ace is plain JS).
CMD ["sh", "-c", "node ace.js migration:run --force && node bin/server.js"]
