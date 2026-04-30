import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ClaimBlockGuard } from './guards/claim-block.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ClaimTaskDto } from './dto/claim-task.dto';
import { ParseTaskRequestDto } from './dto/parse-task-request.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Post('parse')
  async parseTaskDraft(
    @Body() parseTaskRequestDto: ParseTaskRequestDto,
    @Request() req,
  ) {
    return this.tasksService.parseTaskDraft(
      parseTaskRequestDto.freeText,
      req.user.id,
    );
  }

  @Get('feed')
  async getFeed(@Request() req, @Query('city') city?: string) {
    return this.tasksService.getFeed(city || 'Астана', req.user.id);
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
  @UseGuards(ClaimBlockGuard) // Block users who exceeded cancel/refuse limits
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

  @Delete(':id')
  async deleteOwnTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.deleteOwnTask(id, req.user.id);
  }
}
