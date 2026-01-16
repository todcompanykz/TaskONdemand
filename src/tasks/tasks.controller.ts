import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ClaimTaskDto } from './dto/claim-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get('feed')
  async getFeed(
    @Query('longitude') longitude: number,
    @Query('latitude') latitude: number,
    @Request() req,
  ) {
    return this.tasksService.getFeed(
      parseFloat(longitude.toString()),
      parseFloat(latitude.toString()),
      req.user.id,
    );
  }

  @Get('history')
  async getHistory(@Request() req) {
    return this.tasksService.getUserHistory(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.tasksService.findOne(id, req.user.id);
  }

  @Post('claim')
  async claimTask(@Body() claimTaskDto: ClaimTaskDto, @Request() req) {
    return this.tasksService.claimTask(claimTaskDto.taskId, req.user.id);
  }

  @Post(':id/cancel')
  async cancelTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.cancelTask(id, req.user.id);
  }

  @Post(':id/refuse')
  async refuseTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.refuseTask(id, req.user.id);
  }

  @Post(':id/confirm-work')
  async confirmWorkCompleted(@Param('id') id: string, @Request() req) {
    return this.tasksService.confirmWorkCompleted(id, req.user.id);
  }

  @Post(':id/confirm-payment')
  async confirmPaymentReceived(@Param('id') id: string, @Request() req) {
    return this.tasksService.confirmPaymentReceived(id, req.user.id);
  }
}
