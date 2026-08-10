# Atlas API

Backend REST API for the Atlas enterprise multi-tenant AI Operating System.

## Technology Stack

- **Framework**: NestJS
- **ORM & Database**: Prisma & PostgreSQL (Supabase)
- **Authentication**: JWT & Passport (`@nestjs/jwt`, `passport-jwt`, `bcrypt`)
- **Security**: Helmet, CORS, `@nestjs/throttler` (Rate Limiting)
- **Validation**: Global `ValidationPipe` with `class-validator` & `class-transformer`
- **Observability**: `nestjs-pino` (Structured Logging & Request Correlation `x-request-id`)
- **Documentation**: Swagger OpenAPI (`/api/docs`)

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development server
pnpm --filter api start:dev

# Run unit tests
pnpm --filter api test

# Run E2E integration tests
pnpm --filter api test:e2e

# Build production bundle
pnpm --filter api build
```

## API & Documentation

- **Base API URL**: `http://localhost:3000/api/v1`
- **Swagger Documentation**: `http://localhost:3000/api/docs`

## Authentication & Security

Protected endpoints require a Bearer token in the request header:

```http
Authorization: Bearer <access-token>
```

All responses follow standardized JSON envelopes:

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-08-10T18:19:00.000Z",
  "path": "/api/v1/users",
  "error": "Error description or array of validation messages"
}
```

## Database & Prisma Commands

- **Prisma Schema**: `database/prisma/prisma/schema.prisma`
- **Validate Schema**: `pnpm prisma validate --config ../../database/prisma/prisma.config.ts` (from `apps/api`)
- **Generate Client**: `pnpm prisma generate --config ../../database/prisma/prisma.config.ts` (from `apps/api`)
- **Check Migration Status**: `pnpm prisma migrate status --config ../../database/prisma/prisma.config.ts` (from `apps/api`)
