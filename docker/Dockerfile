# syntax=docker/dockerfile:1.7

# Versions pinned in one place (verified 2026-11-11).
ARG NODE_VERSION=26.13.1
ARG ALPINE_VERSION=3.24
ARG PNPM_VERSION=12.18.0
ARG NGINX_VERSION=1.31.7

# ---------- deps: install dependencies (cached on lockfile) ----------
FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION} AS deps
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN npm install -g pnpm@${PNPM_VERSION} --no-fund --no-audit
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- dev: hot-reload target (docker compose --profile dev) ----------
FROM deps AS dev
ENV NODE_ENV=development \
    PORT=8443
COPY . .
EXPOSE 8443
CMD ["pnpm", "dev"]

# ---------- build: produce static bundle ----------
FROM deps AS build
ARG FIGMA_PUBLIC_URL=""
ENV FIGMA_PUBLIC_URL=${FIGMA_PUBLIC_URL} \
    NODE_ENV=production
COPY index.html vite.config.ts tsconfig.json ./
COPY .figma/make/site.json ./.figma/make/site.json
COPY public ./public
COPY src ./src
RUN pnpm build

# ---------- runtime: tiny, non-root static server ----------
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine${ALPINE_VERSION} AS runtime
COPY --chown=101:101 docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html
USER 101
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:8080/healthz || exit 1
