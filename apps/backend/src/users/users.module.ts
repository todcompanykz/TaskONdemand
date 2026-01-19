import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { Task } from '../tasks/entities/task.entity';
import { UserNotificationSettings } from './entities/user-notification-settings.entity';
import { ReviewsModule } from '../reviews/reviews.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Task, UserNotificationSettings]),
    ReviewsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
