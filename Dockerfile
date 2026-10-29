# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22.15.1

# ── Dependencies (cached until the lockfile changes) ─────────────────────────
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

# ── Build ────────────────────────────────────────────────────────────────────
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so they
# are build arguments, not runtime env: build one image per environment. They
# are public by definition; never pass secrets here.
ARG NEXT_PUBLIC_BACKEND_URL=http://localhost:9000
ARG NEXT_PUBLIC_API_URL=http://localhost:9000
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=
ENV NEXT_PUBLIC_BACKEND_URL=${NEXT_PUBLIC_BACKEND_URL} \
    NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID} \
    NEXT_OUTPUT_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ── Runtime: Next's standalone server, no full node_modules ─────────────────
FROM node:${NODE_VERSION}-alpine AS runtime
# The app runs with `node` directly, so the package managers (and the
# vulnerabilities scanners keep finding in npm's bundled packages) are removed
RUN apk add --no-cache tini \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack \
           /opt/yarn-* /usr/local/bin/yarn /usr/local/bin/yarnpkg

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

# Server code stays root-owned and read-only; only .next/cache (the image
# optimisation cache) is writable by the app user
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -q --spider "http://127.0.0.1:${PORT}/favicon.ico" || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
