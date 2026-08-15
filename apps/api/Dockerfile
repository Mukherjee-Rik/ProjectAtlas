# Production Dockerfile for Project Atlas API
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install -g pnpm

# Dependencies Stage
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY database/prisma/package.json ./database/prisma/
RUN pnpm install --frozen-lockfile

# Build Stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .
RUN pnpm --filter @project-atlas/prisma-schema generate || true
RUN pnpm --filter api build

# Production Runner Stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nestjs
USER nestjs

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

EXPOSE 3000
CMD ["node", "dist/main.js"]
