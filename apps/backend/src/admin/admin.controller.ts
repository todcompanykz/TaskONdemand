import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SupportService } from '../support/support.service';
import { ReplySupportRequestDto } from '../support/dto/reply-support-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly supportService: SupportService,
  ) {}

  @Get('users')
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get('tasks')
  async getTasks() {
    return this.adminService.getTasks();
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('analytics')
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Delete('tasks/:id')
  async deleteTask(@Param('id') id: string) {
    return this.adminService.deleteTask(id);
  }

  @Post('users/:id/restrict')
  async restrictUser(@Param('id') id: string, @Request() req) {
    return this.adminService.restrictUser(id, req.user.id);
  }

  @Post('users/:id/unrestrict')
  async unrestrictUser(@Param('id') id: string, @Request() req) {
    return this.adminService.unrestrictUser(id, req.user.id);
  }

  @Post('support/:id/reply')
  async replyToSupportRequest(
    @Param('id') id: string,
    @Request() req,
    @Body() dto: ReplySupportRequestDto,
  ) {
    return this.supportService.replyToSupportRequest(id, req.user.id, dto);
  }
}
