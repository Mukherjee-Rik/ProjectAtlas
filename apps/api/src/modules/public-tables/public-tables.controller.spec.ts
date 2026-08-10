import { Test, TestingModule } from '@nestjs/testing';
import { PublicTablesController } from './public-tables.controller';
import { PublicTablesService } from './public-tables.service';

describe('PublicTablesController', () => {
  let controller: PublicTablesController;
  let service: any;

  beforeEach(async () => {
    service = {
      resolveTableToken: jest.fn(),
      getOrCreateSession: jest.fn(),
      endSession: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicTablesController],
      providers: [{ provide: PublicTablesService, useValue: service }],
    }).compile();

    controller = module.get<PublicTablesController>(PublicTablesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('resolveTableToken should delegate to service.resolveTableToken', async () => {
    await controller.resolveTableToken('token-1');
    expect(service.resolveTableToken).toHaveBeenCalledWith('token-1');
  });

  it('getOrCreateSession should delegate to service.getOrCreateSession', async () => {
    await controller.getOrCreateSession('token-1');
    expect(service.getOrCreateSession).toHaveBeenCalledWith('token-1');
  });
});
