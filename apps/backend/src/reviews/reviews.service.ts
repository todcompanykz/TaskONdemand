import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from './entities/review.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async createReview(
    taskId: string,
    fromUserId: string,
    createReviewDto: CreateReviewDto,
  ): Promise<Review> {
    // Find task and verify it's completed
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.status !== TaskStatus.COMPLETED) {
      throw new BadRequestException('Reviews can only be left for completed tasks');
    }

    // Verify user is part of the task (either creator or executor)
    const isCreator = task.createdById === fromUserId;
    const isExecutor = task.claimedById === fromUserId;

    if (!isCreator && !isExecutor) {
      throw new BadRequestException('You can only review tasks you participated in');
    }

    // Determine target user (the other party)
    const toUserId = isCreator ? task.claimedById : task.createdById;

    if (!toUserId) {
      throw new BadRequestException('Task has no executor');
    }

    // Check if review already exists
    const existingReview = await this.reviewsRepository.findOne({
      where: { fromUserId, taskId },
    });

    if (existingReview) {
      throw new ConflictException('You have already reviewed this task');
    }

    // Create review and update user rating in transaction
    return await this.dataSource.transaction(async (manager) => {
      const reviewRepo = manager.getRepository(Review);
      const userRepo = manager.getRepository(User);

      // Create review
      const review = reviewRepo.create({
        fromUserId,
        toUserId,
        taskId,
        rating: createReviewDto.rating,
        comment: createReviewDto.comment || null,
      });

      const savedReview = await reviewRepo.save(review);

      // Update recipient's rating
      const recipient = await userRepo.findOne({ where: { id: toUserId } });
      if (recipient) {
        const allReviews = await reviewRepo.find({ where: { toUserId } });
        const avgRating =
          allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

        recipient.ratingAvg = Math.round(avgRating * 100) / 100; // Round to 2 decimals
        recipient.ratingCount = allReviews.length;
        await userRepo.save(recipient);
      }

      return savedReview;
    });
  }

  async getUserReviews(userId: string): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { toUserId: userId },
      relations: ['fromUser', 'task'],
      order: { createdAt: 'DESC' },
    });
  }
}
