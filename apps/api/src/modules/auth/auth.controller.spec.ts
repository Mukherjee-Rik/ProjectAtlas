import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;

  beforeEach(async () => {
    authService = {
      login: jest.fn().mockResolvedValue({
        accessToken: 'jwt-token',
        user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    it('should call authService.login and return result', async () => {
      const loginDto = { email: 'test@example.com', password: 'password123' };
      const mockReq = {
        headers: { 'x-forwarded-for': '127.0.0.1', 'user-agent': 'Jest' },
      };
      const mockRes = { cookie: jest.fn() };
      const res = await controller.login(
        loginDto,
        mockReq as any,
        mockRes as any,
      );

      expect(authService.login).toHaveBeenCalledWith(
        loginDto.email,
        loginDto.password,
        '127.0.0.1',
        'Jest',
      );
      expect(res).toEqual({
        accessToken: 'jwt-token',
        user: { id: 'user-1', email: 'test@example.com', role: 'USER' },
        memberships: undefined,
      });
    });
  });
});
