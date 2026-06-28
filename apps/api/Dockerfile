#Stage 1
FROM node:24-alpine AS builder
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm dlx turbo prune @repo/api --docker

#Stage 2
FROM node:22-alpine AS installer
RUN corepack enable
WORKDIR /app
COPY --from=builder /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=builder /app/out/full/ .
RUN pnpm --filter @repo/api build

#Stage 3
FROM node:22-alpine
RUN corepack enable
WORKDIR /app
COPY --from=installer /app .
EXPOSE 8000
CMD ["pnpm", "--filter", "api", "start"]