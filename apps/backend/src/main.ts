import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import dataSource from './database/data-source';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  // Run database migrations before starting the application
  try {
    console.log('Running database migrations...');
    await dataSource.initialize();
    const migrations = await dataSource.runMigrations();
    
    // #region agent log
    try {
      const fs = require('fs');
      const path = require('path');
      const logEntry = JSON.stringify({location:'main.ts:11',message:'Migrations executed',data:{migrationCount:migrations.length,migrations:migrations.map(m => ({name:m.name,timestamp:m.timestamp}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    // Check users with SUPER_ADMIN role after migration
    const User = (await import('./users/entities/user.entity')).User;
    const { UserRole } = await import('./common/enums/user-role.enum');
    const superAdmins = await dataSource.manager.find(User, {
      where: { role: UserRole.SUPER_ADMIN },
    });

    // #region agent log
    try {
      const fs = require('fs');
      const path = require('path');
      const logEntry = JSON.stringify({location:'main.ts:22',message:'Super admins after migration',data:{superAdminCount:superAdmins.length,superAdmins:superAdmins.map(u => ({id:u.id,email:u.email,role:u.role}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    await dataSource.destroy();
    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Error running database migrations:', error);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);

  // #region agent log
  app.use((req, res, next) => {
    if (req.originalUrl?.startsWith('/support')) {
      try {
        fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main.ts:supportRequest:entry',message:'Incoming support request',data:{method:req.method,url:req.originalUrl},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'S'})}).catch(()=>{});
      } catch (e) {}
    }
    next();
  });
  // #endregion

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
      
      const isAllowed = allowedPatterns.some(pattern => pattern.test(origin));
      
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
