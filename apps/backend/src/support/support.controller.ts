import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportRequestDto } from './dto/create-support-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../admin/guards/admin.guard';

@Controller('support')
@UseGuards(JwtAuthGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post()
  async createSupportRequest(
    @Request() req,
    @Body() createSupportRequestDto: CreateSupportRequestDto,
  ) {
    return this.supportService.createSupportRequest(req.user.id, createSupportRequestDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  async getAllSupportRequests(@Request() req) {
    // #region agent log
    const fs = require('fs');
    const logPath = 'c:\\Cursorproject\\Todmvp\\.cursor\\debug.log';
    const logEntry = JSON.stringify({location:'support.controller.ts:getAllSupportRequests:entry',message:'getAllSupportRequests endpoint called',data:{userId:req.user?.id,isAdmin:req.user?.isAdmin},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})+'\n';
    fs.appendFileSync(logPath, logEntry);
    // #endregion
    const result = await this.supportService.getAllSupportRequests();
    // #region agent log
    const logEntry2 = JSON.stringify({location:'support.controller.ts:getAllSupportRequests:result',message:'getAllSupportRequests returning',data:{count:result.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})+'\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion
    return result;
  }
}
