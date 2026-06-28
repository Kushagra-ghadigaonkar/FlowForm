#Stage 1
FROM node:24-alpine AS base
RUN npm install -g pnpm
ENV CD=true

#Stage 2
FROM base AS pruner
WORKDIR /app
COPY . .
RUN npx turbo prune @repo/api --docker

#Stage 3
FROM base AS installer
WORKDIR /app
COPY --from=pruner app/out/json .
COPY --from=pruner app/out/pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile

#Stage 4
FROM base AS builder
WORKDIR /app
COPY --from=installer /app/ .
COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=@repo/api...

#Stage 5
FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=installer /app/apps/api/package.json .

EXPOSE 8000
CMD ["node", "dist/index.js"]