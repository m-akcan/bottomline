# syntax=docker/dockerfile:1.7

# Bottomline — self-hosted single-user finance ledger.
# Multi-stage build that produces a Debian-slim runtime with the Next.js
# production server, the better-sqlite3 native module, and the tsx-runnable
# Drizzle migration script. SQLite data is expected to live on a mounted
# volume at /app/data so it survives container rebuilds.

ARG NODE_VERSION=22
ARG PNPM_VERSION=11.0.9

# ---------- Base ----------
FROM node:${NODE_VERSION}-bookworm-slim AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
WORKDIR /app

# ---------- Dependencies ----------
# Install full dependency graph. python3/make/g++ are present in case
# better-sqlite3's prebuilt binary is unavailable for this platform and
# node-gyp has to compile from source.
FROM base AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm config set store-dir /pnpm/store \
    && pnpm install --frozen-lockfile

# ---------- Build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm build

# ---------- Runtime ----------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    DATABASE_PATH=/app/data/bottomline.db

# Non-root user so the mounted /app/data volume can be locked down.
RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs --home-dir /app nextjs \
    && mkdir -p /app/data \
    && chown -R nextjs:nodejs /app

# Production runtime needs: built .next output, the full dependency graph
# (next start + better-sqlite3 + tsx for migrations), and the source files
# the migrate script imports at runtime (db/, lib/).
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder --chown=nextjs:nodejs /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder --chown=nextjs:nodejs /app/next.config.ts ./next.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=nextjs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/db ./db
COPY --from=builder --chown=nextjs:nodejs /app/lib ./lib
COPY --from=builder --chown=nextjs:nodejs /app/app ./app
COPY --from=builder --chown=nextjs:nodejs /app/components ./components

USER nextjs

EXPOSE 3000

# Apply pending Drizzle migrations then hand off to next start.
CMD ["sh", "-c", "pnpm db:migrate && pnpm start"]
