import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { TravelService } from '../travel/travel.service.js';
import type { CreateDestinationReviewDto } from '../travel/travel.schemas.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly travelService: TravelService,
  ) {}

  @Get('me')
  getProfile(@Session() session: UserSession) {
    return this.usersService.getProfile(session);
  }

  @Get('me/travel')
  getMyTravelState(@Session() session: UserSession) {
    return this.travelService.getUserTravelProfile(session);
  }

  @Post('me/destinations/:destinationId/likes')
  likeDestination(
    @Param('destinationId') destinationId: string,
    @Session() session: UserSession,
  ) {
    return this.travelService.likeDestination(destinationId, session);
  }

  @Delete('me/destinations/:destinationId/likes')
  unlikeDestination(
    @Param('destinationId') destinationId: string,
    @Session() session: UserSession,
  ) {
    return this.travelService.unlikeDestination(destinationId, session);
  }

  @Post('me/destinations/:destinationId/reviews')
  reviewDestination(
    @Param('destinationId') destinationId: string,
    @Body() payload: CreateDestinationReviewDto,
    @Session() session: UserSession,
  ) {
    return this.travelService.addOrUpdateReview(
      destinationId,
      session,
      payload,
    );
  }
}
