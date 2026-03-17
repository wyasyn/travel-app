import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import type { HealthResponse } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return service health details', () => {
      const health: HealthResponse = appController.getHealth();

      expect(health.status).toBe('ok');
      expect(health.service).toBe('api');
      expect(typeof health.timestamp).toBe('string');
    });
  });
});
