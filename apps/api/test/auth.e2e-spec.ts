import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma/prisma.service';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';

describe('Sprint 2.6.14 Auth Error Handling (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const rawPassword = 'Password123!';
  const hashedPassword = bcrypt.hashSync(rawPassword, 10);

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

  const allUsers = [
    activeAdmin,
    activeUser,
    inactiveUser,
    inactiveAdmin,
    suspendedUser,
    suspendedAdmin,
  ];

  let activeAdminToken: string;
  let activeUserToken: string;
  let inactiveUserToken: string;
  let inactiveAdminToken: string;
  let suspendedUserToken: string;
  let suspendedAdminToken: string;
  let expiredToken: string;

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
    user: {
      findUnique: jest.fn(async ({ where, select }) => {
        const user = allUsers.find((u) => u.id === where.id || u.email === where.email);
        return projectFields(user, select);
      }),
      findFirst: jest.fn(async ({ where, select }) => {
        const user = allUsers.find((u) => u.id === where.id || u.email === where.email);
        return projectFields(user, select);
      }),
      findMany: jest.fn(async ({ select }) => {
        const activeUsersList = allUsers.filter((u) => u.status === 'ACTIVE');
        return activeUsersList.map((u) => projectFields(u, select));
      }),
      create: jest.fn(async ({ data, select }) => {
        const newUser = {
          id: 'created-user-id',
          name: data.name,
          email: data.email,
          phone: data.phone ?? null,
          passwordHash: data.passwordHash,
          role: 'USER',
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return projectFields(newUser, select);
      }),
      update: jest.fn(async ({ where, data, select }) => {
        const base = allUsers.find((u) => u.id === where.id) ?? activeUser;
        const updated = { ...base, ...data };
        return projectFields(updated, select);
      }),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  beforeAll(async () => {
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

    activeAdminToken = jwtService.sign({ sub: activeAdmin.id, email: activeAdmin.email, role: activeAdmin.role });
    activeUserToken = jwtService.sign({ sub: activeUser.id, email: activeUser.email, role: activeUser.role });
    inactiveUserToken = jwtService.sign({ sub: inactiveUser.id, email: inactiveUser.email, role: inactiveUser.role });
    inactiveAdminToken = jwtService.sign({ sub: inactiveAdmin.id, email: inactiveAdmin.email, role: inactiveAdmin.role });
    suspendedUserToken = jwtService.sign({ sub: suspendedUser.id, email: suspendedUser.email, role: suspendedUser.role });
    suspendedAdminToken = jwtService.sign({ sub: suspendedAdmin.id, email: suspendedAdmin.email, role: suspendedAdmin.role });
    expiredToken = jwtService.sign(
      { sub: activeUser.id, email: activeUser.email, role: activeUser.role },
      { expiresIn: '-1s' },
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe('2.6.14.8 — Verification Tests', () => {
    it('Test 1: Wrong email → 401 "Invalid email or password"', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'doesnotexist@example.com', password: rawPassword })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
        error: 'Invalid email or password',
      });
    });

    it('Test 2: Wrong password → 401 "Invalid email or password"', async () => {
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

    it('Test 3: No JWT → 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
      });
    });

    it('Test 4: Invalid JWT string → 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer this-is-not-a-real-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
      });
    });

    it('Test 5: Expired JWT → 401 Unauthorized', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 401,
      });
    });

    it('Test 6: USER → ADMIN endpoint → 403 Forbidden', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${activeUserToken}`)
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        statusCode: 403,
      });
    });

    it('Test 7: ADMIN → ADMIN endpoint → 200 OK', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${activeAdminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Authorization Matrix (Inactive / Suspended)', () => {
    it('Inactive user → 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${inactiveUserToken}`)
        .expect(401);
    });

    it('Suspended user → 401', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${suspendedUserToken}`)
        .expect(401);
    });
  });
});
