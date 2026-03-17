import { Injectable } from '@nestjs/common';
import type { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class UsersService {
  getProfile(session: UserSession) {
    return {
      user: session.user,
      session: session.session,
    };
  }
}
