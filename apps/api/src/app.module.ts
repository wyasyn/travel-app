import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from './lib/auth.js';
import { AdminModule } from './modules/admin/admin.module.js';
import { TravelModule } from './modules/travel/travel.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
        rawBody: true,
      },
    }),
    TravelModule,
    UsersModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
