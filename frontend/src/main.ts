import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalFilters(new DatabaseExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Alumni Pool API')
    .setDescription('Smart Inventory & Order Management backend API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT ?? 3001);
}
void bootstrap();
