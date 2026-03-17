import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { Roles, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { TravelService } from '../travel/travel.service.js';
import type {
  CreateDestinationDto,
  UpdateDestinationDto,
} from '../travel/travel.schemas.js';

@Controller('admin/destinations')
@Roles(['admin'])
export class AdminDestinationsController {
  constructor(private readonly travelService: TravelService) {}

  @Get()
  listDestinations() {
    return this.travelService.adminListDestinations();
  }

  @Post()
  createDestination(
    @Body() payload: CreateDestinationDto,
    @Session() session: UserSession,
  ) {
    return this.travelService.adminCreateDestination(payload, session);
  }

  @Patch(':destinationId')
  updateDestination(
    @Param('destinationId') destinationId: string,
    @Body() payload: UpdateDestinationDto,
    @Session() session: UserSession,
  ) {
    return this.travelService.adminUpdateDestination(
      destinationId,
      payload,
      session,
    );
  }

  @Delete(':destinationId')
  deleteDestination(@Param('destinationId') destinationId: string) {
    return this.travelService.adminDeleteDestination(destinationId);
  }
}
