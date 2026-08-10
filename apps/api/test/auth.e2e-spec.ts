import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Sprint 2.7.7 Full API Integration (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const rawPassword = 'Password123!';
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);

  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  const activeAdmin = {
    id: 'admin-active-1',
    name: 'Active Admin',
    email: 'admin-active@example.com',
    phone: null,
    passwordHash: hashedPassword,
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const activeUser = {
    id: 'user-active-2',
    name: 'Active User',
    email: 'user-active@example.com',
    phone: null,
    passwordHash: hashedPassword,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const inactiveUser = {
    id: 'user-inactive-3',
    name: 'Inactive User',
    email: 'user-inactive@example.com',
    phone: null,
    passwordHash: hashedPassword,
    role: 'USER',
    status: 'INACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const inactiveAdmin = {
    id: 'admin-inactive-4',
    name: 'Inactive Admin',
    email: 'admin-inactive@example.com',
    phone: null,
    passwordHash: hashedPassword,
    role: 'ADMIN',
    status: 'INACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const suspendedUser = {
    id: 'user-suspended-5',
    name: 'Suspended User',
    email: 'user-suspended@example.com',
    phone: null,
    passwordHash: hashedPassword,
    role: 'USER',
    status: 'SUSPENDED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const suspendedAdmin = {
    id: 'admin-suspended-6',
    name: 'Suspended Admin',
    email: 'admin-suspended@example.com',
    phone: null,
    passwordHash: hashedPassword,
    role: 'ADMIN',
    status: 'SUSPENDED',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createdUserDb = {
    id: validUuid,
    name: 'Atlas Integration User',
    email: 'integration@example.com',
    phone: '9876543210',
    passwordHash: hashedPassword,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  let dbStore: any[] = [];

  let activeAdminToken: string;
  let activeUserToken: string;

  const projectFields = (user: any, select?: Record<string, boolean>) => {
    if (!user) return null;
    if (!select) return user;
    const res: any = {};
    for (const key of Object.keys(select)) {
      if (select[key]) res[key] = user[key];
    }
    return res;
  };

  const mockPrismaService = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    user: {
      findUnique: jest.fn(async ({ where, select }) => {
        const user = dbStore.find(
          (u) => u.id === where.id || u.email === where.email,
        );
        return projectFields(user, select);
      }),
      findFirst: jest.fn(async ({ where, select }) => {
        const user = dbStore.find((u) => {
          if (where.id && u.id !== where.id) return false;
          if (where.email && u.email !== where.email) return false;
          if (where.status && u.status !== where.status) return false;
          if (where.OR) {
            const matchesOr = where.OR.some((cond: any) => {
              if (cond.email && u.email === cond.email) return true;
              if (cond.phone && u.phone === cond.phone) return true;
              return false;
            });
            if (!matchesOr) return false;
          }
          if (where.NOT && where.NOT.id && u.id === where.NOT.id) return false;
          return true;
        });
        return projectFields(user, select);
      }),
      findMany: jest.fn(async ({ where, select }) => {
        const statusFilter = where?.status;
        const activeUsersList = statusFilter
          ? dbStore.filter((u) => u.status === statusFilter)
          : dbStore;
        return activeUsersList.map((u) => projectFields(u, select));
      }),
      create: jest.fn(async ({ data, select }) => {
        const newUser = {
          id: validUuid,
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          passwordHash: data.passwordHash,
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbStore.push(newUser);
        return projectFields(newUser, select);
      }),
      update: jest.fn(async ({ where, data, select }) => {
        const index = dbStore.findIndex((u) => u.id === where.id);
        if (index === -1) return null;
        dbStore[index] = { ...dbStore[index], ...data };
        return projectFields(dbStore[index], select);
      }),
      delete: jest.fn(async ({ where, select }) => {
        const index = dbStore.findIndex((u) => u.id === where.id);
        if (index === -1) return null;
        const [deleted] = dbStore.splice(index, 1);
        return projectFields(deleted, select);
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
    dbStore = [
      activeAdmin,
      activeUser,
      inactiveUser,
      inactiveAdmin,
      suspendedUser,
      suspendedAdmin,
    ];

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    jwtService = app.get(JwtService);

    activeAdminToken = jwtService.sign({
      sub: activeAdmin.id,
      email: activeAdmin.email,
      role: activeAdmin.role,
    });
    activeUserToken = jwtService.sign({
      sub: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
    });
    inactiveUserToken = jwtService.sign({
      sub: inactiveUser.id,
      email: inactiveUser.email,
      role: inactiveUser.role,
    });
    inactiveAdminToken = jwtService.sign({
      sub: inactiveAdmin.id,
      email: inactiveAdmin.email,
      role: inactiveAdmin.role,
    });
    suspendedUserToken = jwtService.sign({
      sub: suspendedUser.id,
      email: suspendedUser.email,
      role: suspendedUser.role,
    });
    suspendedAdminToken = jwtService.sign({
      sub: suspendedAdmin.id,
      email: suspendedAdmin.email,
      role: suspendedAdmin.role,
    });
    expiredToken = jwtService.sign(
      { sub: activeUser.id, email: activeUser.email, role: activeUser.role },
      { expiresIn: '-1s' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Checks', () => {
    it('GET /api/v1/health → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('ok');
    });

    it('GET /api/v1/health/database → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/health/database')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.database).toBe('connected');
    });
  });

  describe('User Registration & Login', () => {
    it('POST /api/v1/users → 201 Created (password & passwordHash masked)', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: createdUserDb.name,
          email: createdUserDb.email,
          phone: createdUserDb.phone,
          password: rawPassword,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(createdUserDb.email);
      expect(response.body.data.password).toBeUndefined();
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('POST /api/v1/auth/login → 200 OK with accessToken', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: activeUser.email, password: rawPassword })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(activeUser.email);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('POST /api/v1/auth/login with wrong password → 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: activeUser.email, password: 'WrongPassword123!' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        error: 'Invalid email or password',
      });
    });
  });

  describe('/users/me Profile & Authentication Guards', () => {
    it('GET /api/v1/users/me with valid USER token → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${activeUserToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(activeUser.email);
    });

    it('GET /api/v1/users/me with missing JWT → 401 Unauthorized', async () => {
      await request(app.getHttpServer()).get('/api/v1/users/me').expect(401);
    });

    it('GET /api/v1/users/me with invalid JWT string → 401 Unauthorized', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token-string')
        .expect(401);
    });
  });

  describe('Authorization Matrix (USER vs ADMIN)', () => {
    it('USER accessing GET /users → 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${activeUserToken}`)
        .expect(403);
    });

    it('USER accessing GET /users/:id → 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/users/${validUuid}`)
        .set('Authorization', `Bearer ${activeUserToken}`)
        .expect(403);
    });

    it('USER accessing PATCH /users/:id → 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/users/${validUuid}`)
        .send({ name: 'Hacked' })
        .set('Authorization', `Bearer ${activeUserToken}`)
        .expect(403);
    });

    it('USER accessing DELETE /users/:id → 403 Forbidden', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/users/${validUuid}`)
        .set('Authorization', `Bearer ${activeUserToken}`)
        .expect(403);
    });

    it('ADMIN accessing GET /users → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('ADMIN Full User CRUD Lifecycle', () => {
    it('ADMIN GET /users/:id → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${validUuid}`)
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(validUuid);
      expect(response.body.data.passwordHash).toBeUndefined();
    });

    it('ADMIN PATCH /users/:id → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/users/${validUuid}`)
        .send({ name: 'Atlas Renamed User' })
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Atlas Renamed User');
    });

    it('ADMIN DELETE /users/:id → 200 OK (soft-delete to INACTIVE)', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${validUuid}`)
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('INACTIVE');
    });

    it('ADMIN GET /users/:id on deleted user → 404 Not Found', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${validUuid}`)
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(404);
    });
  });

  describe('Input Validation & Boundary Protections', () => {
    it('Invalid DTO payload → 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({ name: 'A', email: 'invalid-email', password: '123' })
        .expect(400);
    });

    it('Unknown DTO property injection (role: ADMIN) → 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users')
        .send({
          name: 'Privilege Escalator',
          email: 'escalate@example.com',
          password: rawPassword,
          role: 'ADMIN',
        })
        .expect(400);
    });

    it('Non-UUID parameter on /users/:id → 400 Bad Request', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/not-a-valid-uuid')
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(400);
    });

    it('Unknown route → 404 Not Found', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/does-not-exist')
        .expect(404);
    });
  });

  describe('Rate Limiting & Throttling', () => {
    it('Exceeding login rate limit → 429 Too Many Requests', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: activeUser.email, password: 'WrongPassword123!' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: activeUser.email, password: 'WrongPassword123!' })
        .expect(401);

      await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: activeUser.email, password: 'WrongPassword123!' })
        .expect(401);

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: activeUser.email, password: 'WrongPassword123!' })
        .expect(429);

      expect(response.body.statusCode).toBe(429);
    });
  });
});
