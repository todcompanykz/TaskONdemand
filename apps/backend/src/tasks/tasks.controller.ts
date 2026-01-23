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
import { ClaimBlockGuard } from './guards/claim-block.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { ClaimTaskDto } from './dto/claim-task.dto';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto, @Request() req) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8c69d9e6-e12c-4335-8ddd-7b9bc9b0fafd',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'tasks.controller.ts:create:entry',message:'create task called',data:{receivedDto:createTaskDto,hasLongitude:'longitude' in createTaskDto,hasLatitude:'latitude' in createTaskDto,hasCity:'city' in createTaskDto,hasAddress:'address' in createTaskDto},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    return this.tasksService.create(createTaskDto, req.user.id);
  }

  @Get('feed')
  async getFeed(
    @Request() req,
    @Query('city') city?: string,
  ) {
    return this.tasksService.getFeed(
      city || 'Астана',
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
}
