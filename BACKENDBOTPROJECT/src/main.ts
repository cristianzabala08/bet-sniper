// main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { StaffService } from './staff/staff.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const PORT = configService.get('PORT') || 3000;
  const API_URL = configService.get('API_URL') || `http://localhost:${PORT}`;

  // --- HABILITAR CORS ---
  const rawOrigins = [
    'http://localhost:3000',
    'http://localhost:4200',
    'http://localhost:4000',
    'http://localhost:5173',
    'https://betsniper.com',
    'http://betsniper.com',
    'https://www.betsniper.com',
    'http://www.betsniper.com',
    'https://panel.betsniper.com',
    'http://panel.betsniper.com',
    'https://services.betsniper.com',
    'http://services.betsniper.com',
    'https://app.betsniper.com',
    'http://app.betsniper.com',
    'https://appserver.winxplay.io',
    'http://appserver.winxplay.io',
    'https://appserver.winxplay.io:8001',
    'http://appserver.winxplay.io:8001',
    configService.get<string>('FRONTEND_PWA_URL'),
    configService.get<string>('ADMIN_PANEL_URL'),
    configService.get<string>('FRONTEND_URL'),
  ];

  // Filtramos nulos, quitamos espacios y eliminamos slashes finales de cada origen
  const origins = rawOrigins
    .filter((o): o is string => !!o)
    .map((origin) => origin.trim().replace(/\/$/, ''));

  // Eliminamos duplicados
  const uniqueOrigins = [...new Set(origins)];

  app.enableCors({
    origin: uniqueOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // --- SWAGGER CONFIG ---
  const config = new DocumentBuilder()
    .setTitle('Tapvia API')
    .setDescription('API Documentation generated with NestJS Swagger')
    .setVersion('1.0.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description: 'Ingrese su token JWT',
    })
    .addServer(`http://localhost:${PORT}`, 'Local Server')
    .addServer(API_URL, 'Production Server (Env)')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  app.useGlobalInterceptors(new LoggingInterceptor());

  await app.listen(PORT);
  console.log(`🚀 API running on: http://localhost:${PORT}`);
  console.log(`📘 Swagger Docs: http://localhost:${PORT}/docs`);

  // Seed Super Admin on startup (idempotente)
  try {
    const staffService = app.get(StaffService);
    await staffService.seedSuperAdmin();
  } catch (error) {
    console.error('Error seeding Super Admin:', error.message);
  }
}

bootstrap();
