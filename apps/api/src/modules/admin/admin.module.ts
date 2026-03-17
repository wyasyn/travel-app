import { Module } from '@nestjs/common';
import { TravelModule } from '../travel/travel.module.js';
import { AdminDestinationsController } from './admin-destinations.controller.js';

@Module({
  imports: [TravelModule],
  controllers: [AdminDestinationsController],
})
export class AdminModule {}
