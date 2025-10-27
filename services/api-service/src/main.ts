import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // Enable CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN')?.split(',') || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API prefix
  app.setGlobalPrefix('api/v1');

  const port = configService.get('API_SERVICE_PORT') || 3000;
  const host = configService.get('API_SERVICE_HOST') || '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 API Service running on http://${host}:${port}`);
  console.log(`📚 Environment: ${configService.get('NODE_ENV')}`);
}

bootstrap();
