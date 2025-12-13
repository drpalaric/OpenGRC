import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  });

  // Global pipes and filters
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // API prefix
  app.setGlobalPrefix('api/frameworks');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('GRC Frameworks Service')
    .setDescription('Frameworks and Compliance Management API')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('frameworks')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/frameworks/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.log(`Frameworks Service running on port ${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/frameworks/docs`);
}

bootstrap();
