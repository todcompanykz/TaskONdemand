import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import dataSource from './database/data-source';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import * as express from 'express';

async function bootstrap() {
  // Run database migrations before starting the application
  try {
    console.log('Running database migrations...');

    await dataSource.initialize();

    await dataSource.runMigrations();

    // Sanity check: ensure critical columns exist after migrations.
    // If migrations weren't discovered/executed, the next query will fail with an unhelpful "column does not exist".
    let hasUserRoleColumn = false;
    try {
      const roleCol = await dataSource.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND table_name = 'users'
           AND column_name = 'role'
         LIMIT 1`,
      );
      hasUserRoleColumn = Array.isArray(roleCol) && roleCol.length > 0;
    } catch (e) {}

    if (!hasUserRoleColumn) {
      throw new Error(
        'Database migrations did not create users.role. This usually means migrations were not discovered/executed for this runtime build.',
      );
    }

    // Check users with SUPER_ADMIN role after migration
    const User = (await import('./users/entities/user.entity')).User;
    const { UserRole } = await import('./common/enums/user-role.enum');

    const superAdmins = await dataSource.manager.find(User, {
      where: { role: UserRole.SUPER_ADMIN },
    });

    await dataSource.destroy();
    console.log(
      `Database migrations completed successfully. SUPER_ADMIN users found: ${superAdmins.length}`,
    );
  } catch (error) {
    console.error('Error running database migrations:', error);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // Increase payload limit for task creation with photos (base64 JSON body).
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ limit: '20mb', extended: true }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new LoggingInterceptor());

  // Dynamic CORS: allow requests from localhost and local network IPs
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost and any IP in local network (192.168.x.x, 10.x.x.x, etc.)
      const allowedPatterns = [
        /^http:\/\/localhost(:\d+)?$/,
        /^http:\/\/127\.0\.0\.1(:\d+)?$/,
        /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/,
        /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+(:\d+)?$/,
      ];

      const isAllowed = allowedPatterns.some((pattern) => pattern.test(origin));

      if (isAllowed) {
        callback(null, true);
      } else {
        console.log('[CORS] Blocked origin:', origin);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: false, // Changed to false to match frontend axios config
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
