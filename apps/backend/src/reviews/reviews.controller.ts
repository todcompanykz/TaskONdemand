import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':id/review')
  async createReview(
    @Param('id') taskId: string,
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(
      taskId,
      req.user.id,
      createReviewDto,
    );
  }
}
