# Stage 1: Base with dependencies
FROM cgr.dev/chainguard/node:latest-dev AS base
ENV CI=true
ENV PNPM_HOME=/tmp/pnpm
ENV PATH=${PNPM_HOME}:$PATH

RUN mkdir -p ${PNPM_HOME} && \
    npm install --prefix ${PNPM_HOME} pnpm@9.0.0 && \
    npm cache clean --force

# Stage 2: Prune dependencies and code
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune web --docker

# Stage 3: Install dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
COPY --from=pruner /app/out/pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Stage 4: Build application
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=web... && \
    pnpm prune --prod --no-optional

# Stage 5: Production runtime
FROM cgr.dev/chainguard/node:latest AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy built app and node_modules
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json

EXPOSE 3000

# Chainguard node image runs as nonroot user by default (uid 65532)
CMD ["node", "--enable-source-maps", "apps/web/server.js"]