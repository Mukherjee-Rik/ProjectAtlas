import { VersioningType, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { json } from 'express';

import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.use(compression());
  app.use(helmet());
  app.use(json({ limit: '1mb' }));
  app.use(cookieParser());

  // Railway (and any PaaS load balancer) terminates TLS and forwards the real
  // client address in X-Forwarded-For. Without trusting that hop, req.ip is
  // the balancer's address for every request — which would put all users into
  // a single rate-limit bucket and let one busy client 429 everyone else.
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 1);
  app.getHttpAdapter().getInstance().set('trust proxy', trustProxyHops);

  app.enableShutdownHooks();

  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  const allowedOrigins = configService.get<string[]>('cors.origins') ?? [];

  if (allowedOrigins.length === 0) {
    // Reflecting every origin while also allowing credentials lets any site
    // make authenticated calls on a signed-in user's behalf. Kept as the
    // fallback so an unset variable cannot take the deployment down, but it
    // should be set in production.
    console.warn(
      '[CORS] CORS_ORIGIN is not set — reflecting all origins with credentials enabled. Set CORS_ORIGIN to a comma-separated allowlist in production.',
    );
  }

  app.enableCors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
    // Without this the browser re-runs a preflight every ~5s per endpoint,
    // doubling the round trips for any cross-origin request that carries the
    // x-tenant-id / x-restaurant-id / x-branch-id headers.
    maxAge: 86_400,
  });

  const port = Number(process.env.PORT) || 3000;

  // Rewrite unversioned /auth/* requests to /api/v1/auth/*
  const expressInstance = app.getHttpAdapter().getInstance();
  expressInstance.use((req: any, _res: any, next: any) => {
    if (req.url && (req.url.startsWith('/auth/') || req.url === '/auth')) {
      req.url = `/api/v1${req.url}`;
    }
    next();
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalInterceptors(new ResponseInterceptor());

  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('Atlas API')
    .setDescription('Atlas platform REST API')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter JWT access token',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Fast root & health routes for platform healthchecks
  const httpAdapter = app.getHttpAdapter().getInstance();
  httpAdapter.get('/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok', uptime: process.uptime() }),
  );
  httpAdapter.get('/api/health', (_req: any, res: any) =>
    res.status(200).json({ status: 'ok', uptime: process.uptime() }),
  );
  httpAdapter.get('/api', (_req: any, res: any) =>
    res
      .status(200)
      .json({ status: 'ok', message: 'Project Atlas API is live' }),
  );
  httpAdapter.get('/', (_req: any, res: any) =>
    res.status(200).send('Project Atlas API is running'),
  );

  await app.listen(port, '0.0.0.0');
  console.log(`Atlas API running on port ${port}`);
}

void bootstrap();
