#Stage 1
FROM node:24-alpine AS base
RUN npm install -g pnpm
ENV CI=true

#Stage 2 : Categorize Dependencies and code
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune web --docker

#Stage 3 : Install Dependencies
FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./
COPY --from=pruner /app/out/pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

#Stage 4 : Building Phase
FROM base AS builder
WORKDIR /app

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ . 
RUN pnpm turbo run build --filter=web...

#Stage 5 : Final Production runner
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -S -g 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "apps/web/server.js"]