import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AdminGuard } from './guards/admin.guard';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { SupportModule } from '../support/support.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Task]), SupportModule],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
