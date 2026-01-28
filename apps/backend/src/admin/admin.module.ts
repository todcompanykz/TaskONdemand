import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController, AdminTokenController } from './admin.controller';
import { AdminGuard } from './guards/admin.guard';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { AdminAccessToken } from './entities/admin-access-token.entity';
import { SupportModule } from '../support/support.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Task, AdminAccessToken]),
    SupportModule,
    NotificationsModule,
  ],
  controllers: [AdminController, AdminTokenController],
  providers: [AdminService, AdminGuard, SuperAdminGuard, PermissionsGuard],
  exports: [AdminGuard, SuperAdminGuard, PermissionsGuard],
})
export class AdminModule {}
