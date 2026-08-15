FROM node:22-alpine AS builder

WORKDIR /app

# Install OpenSSL and libc dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

# Enable modern PNPM
RUN corepack enable && corepack prepare pnpm@11.10.0 --activate

# Copy dependency definition files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy full repository source
COPY . .

# Generate Prisma Client & Build API
RUN pnpm --filter api build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Copy node_modules and built dist from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/database ./database

EXPOSE 3000

CMD ["node", "apps/api/dist/main.js"]
