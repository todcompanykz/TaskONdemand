import { Controller, Get, Put, UseGuards, Request, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { ReviewsService } from '../reviews/reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly reviewsService: ReviewsService,
  ) {}

  @Get('me')
  async getProfile(@Request() req) {
    return req.user;
  }

  @Get(':id/profile')
  async getUserProfile(@Param('id') id: string) {
    const profile = await this.usersService.getProfile(id);
    const reviews = await this.reviewsService.getUserReviews(id);
    return {
      ...profile,
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        fromUser: {
          id: r.fromUser.id,
          firstName: r.fromUser.firstName,
          lastName: r.fromUser.lastName,
        },
        task: {
          id: r.task.id,
          shortDescription: r.task.shortDescription,
        },
      })),
    };
  }

  @Get(':id/reviews')
  async getUserReviews(@Param('id') id: string) {
    return this.reviewsService.getUserReviews(id);
  }

  @Put('me/profile')
  async updateProfile(@Request() req, @Body() updateDto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, updateDto);
  }

  @Get('me/notifications')
  async getNotificationSettings(@Request() req) {
    return this.usersService.getNotificationSettings(req.user.id);
  }

  @Put('me/notifications')
  async updateNotificationSettings(
    @Request() req,
    @Body() updateDto: UpdateNotificationSettingsDto,
  ) {
    return this.usersService.updateNotificationSettings(req.user.id, updateDto);
  }
}
