import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Required for Better Auth
  });
  await app.listen(process.env.PORT ?? 3000);

  const url = await app.getUrl();
  logger.log(`API running on ${url}`);
}
await bootstrap();
