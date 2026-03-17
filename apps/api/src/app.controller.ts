import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import type { HealthResponse } from './app.service.js';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @AllowAnonymous()
  getHealth(): HealthResponse {
    return this.appService.getHealth();
  }
}
