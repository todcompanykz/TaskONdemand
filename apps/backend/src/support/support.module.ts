import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportRequest } from './entities/support-request.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TypeOrmModule.forFeature([SupportRequest]), NotificationsModule],
  controllers: [SupportController],
  providers: [SupportService],
  exports: [SupportService, TypeOrmModule],
})
export class SupportModule {}
