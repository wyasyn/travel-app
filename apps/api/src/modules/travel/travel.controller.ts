import { Controller, Get, Param, Post } from '@nestjs/common';
import {
  AllowAnonymous,
  OptionalAuth,
  Session,
} from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { TravelService } from './travel.service.js';

@Controller('travel')
export class TravelController {
  constructor(private readonly travelService: TravelService) {}

  @Get('home')
  @AllowAnonymous()
  getHome() {
    return this.travelService.getHome();
  }

  @Get('destinations')
  @AllowAnonymous()
  listDestinations() {
    return this.travelService.listDestinations();
  }

  @Get('destinations/popular')
  @AllowAnonymous()
  listPopularDestinations() {
    return this.travelService.listPopularDestinations();
  }

  @Get('destinations/trending')
  @AllowAnonymous()
  listTrendingDestinations() {
    return this.travelService.listTrendingDestinations();
  }

  @Get('destinations/:slug')
  @AllowAnonymous()
  getDestination(
    @Param('slug') slug: string,
    @Session() session?: UserSession,
  ) {
    return this.travelService.getDestinationBySlug(slug, session);
  }

  @Post('destinations/:destinationId/views')
  @OptionalAuth()
  recordView(
    @Param('destinationId') destinationId: string,
    @Session() session?: UserSession,
  ) {
    return this.travelService.recordView(destinationId, session);
  }
}
