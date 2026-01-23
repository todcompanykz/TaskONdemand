import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, In } from 'typeorm';
import { Task, TaskStatus, TaskUrgency } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStateTransitionService } from './task-state-transition.service';
import { RateLimitService } from './services/rate-limit.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private stateTransitionService: TaskStateTransitionService,
    private rateLimitService: RateLimitService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    // Validate reward is divisible by 5 (DTO validation handles this, but double-check)
    if (createTaskDto.reward % 5 !== 0) {
      throw new BadRequestException('Reward must be divisible by 5');
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    // For MVP: Use coordinates of Astana city center for all tasks
    // In production, this would use a geocoding service to convert address to coordinates
    // Astana coordinates: 71.4304 (longitude), 51.1694 (latitude)
    const longitude = 71.4304;
    const latitude = 51.1694;

    // Use raw SQL to insert PostGIS geometry properly
    // TypeORM has issues with geometry type, so we use ST_SetSRID(ST_MakePoint(...), 4326)
    const result = await this.dataSource.query(
      `INSERT INTO tasks (
        "shortDescription", "fullDescription", reward, city, address, "geoPoint", 
        urgency, status, "createdById", "expiresAt", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, ST_SetSRID(ST_MakePoint($6, $7), 4326), $8, $9, $10, $11, NOW(), NOW())
      RETURNING id`,
      [
        createTaskDto.shortDescription,
        createTaskDto.fullDescription,
        createTaskDto.reward,
        createTaskDto.city,
        createTaskDto.address,
        longitude,
        latitude,
        createTaskDto.urgency,
        TaskStatus.CREATED,
        userId,
        expiresAt,
      ],
    );

    // Fetch the created task with relations
    const savedTask = await this.tasksRepository.findOne({
      where: { id: result[0].id },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!savedTask) {
      throw new BadRequestException('Failed to create task');
    }

    this.logger.log({
      event: 'task_created',
      taskId: savedTask.id,
      userId,
      reward: savedTask.reward,
      expiresAt: savedTask.expiresAt.toISOString(),
      timestamp: new Date().toISOString(),
    });

    return savedTask;
  }

  async getFeed(
    city: string,
    userId: string,
  ): Promise<Task[]> {
    // Default to 'Астана' if city not provided
    const selectedCity = city || 'Астана';

    // Simple city-based filtering using TypeORM QueryBuilder
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.claimedBy', 'claimedBy')
      .where('task.city = :city', { city: selectedCity })
      .andWhere('task.status = :status', { status: TaskStatus.CREATED })
      .andWhere('task.expiresAt > :now', { now: new Date() })
      .orderBy('task.createdAt', 'DESC')
      .getMany();

    this.logger.log(
      `Feed loaded: city=${selectedCity}, userId=${userId}, taskCount=${tasks.length}`,
    );

    return tasks;
  }

  async findOne(id: string, userId?: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // If task is claimed, only creator and claimer can see it
    if (task.status === TaskStatus.CLAIMED && userId) {
      if (
        task.createdById !== userId &&
        task.claimedById !== userId
      ) {
        throw new ForbiddenException('You do not have access to this task');
      }
    }

    return task;
  }

  /**
   * Atomic claim implementation using centralized state transition service
   */
  async claimTask(taskId: string, userId: string): Promise<Task> {
    // Check if user is restricted
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (user?.isRestricted) {
      this.logger.warn({
        event: 'claim_blocked',
        taskId,
        userId,
        reason: 'user_restricted',
      });
      throw new ForbiddenException(
        'You are restricted from claiming tasks. Please contact support.',
      );
    }

    // Check if user is blocked (fast fail before transaction)
    const isBlocked = await this.rateLimitService.isBlocked(userId);
    if (isBlocked) {
      this.logger.warn({
        event: 'claim_blocked',
        taskId,
        userId,
        reason: 'user_blocked',
      });
      throw new ForbiddenException(
        'You are temporarily blocked from claiming tasks',
      );
    }

    // Use centralized transition service for atomic claim
    try {
      const task = await this.stateTransitionService.transitionToClaimed(
        taskId,
        userId,
      );

      this.logger.log({
        event: 'task_claimed',
        taskId,
        userId,
        reward: task.reward,
        timestamp: new Date().toISOString(),
      });

      return task;
    } catch (error) {
      this.logger.error({
        event: 'claim_failed',
        taskId,
        userId,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      throw error;
    }
  }

  async cancelTask(taskId: string, userId: string): Promise<Task> {
    // Check rate limit
    const limitExceeded = await this.rateLimitService.checkAndIncrementCancel(
      userId,
    );
    if (limitExceeded) {
      throw new ForbiddenException(
        'You have exceeded the cancel limit. Claiming is blocked for 24 hours.',
      );
    }

    // Verify user is the creator
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.createdById !== userId) {
      throw new ForbiddenException('Only the task creator can cancel');
    }

    // Use centralized transition service
    const cancelledTask = await this.stateTransitionService.transition(
      taskId,
      TaskStatus.CANCELLED,
      userId,
      'creator_cancelled',
    );

    this.logger.log({
      event: 'task_cancelled',
      taskId,
      userId,
      previousStatus: task.status,
      timestamp: new Date().toISOString(),
    });

    return cancelledTask;
  }

  async refuseTask(taskId: string, userId: string): Promise<Task> {
    // Check rate limit
    const limitExceeded = await this.rateLimitService.checkAndIncrementRefuse(
      userId,
    );
    if (limitExceeded) {
      throw new ForbiddenException(
        'You have exceeded the refuse limit. Claiming is blocked for 24 hours.',
      );
    }

    // Verify user is the executor
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    if (task.claimedById !== userId) {
      throw new ForbiddenException('Only the task executor can refuse');
    }

    // Use centralized transition service
    const cancelledTask = await this.stateTransitionService.transition(
      taskId,
      TaskStatus.CANCELLED,
      userId,
      'executor_refused',
    );

    this.logger.log({
      event: 'task_refused',
      taskId,
      userId,
      previousStatus: task.status,
      timestamp: new Date().toISOString(),
    });

    return cancelledTask;
  }

  async confirmWorkCompleted(taskId: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only creator can confirm work completed
    if (task.createdById !== userId) {
      throw new ForbiddenException('Only the task creator can confirm completion');
    }

    if (task.status !== TaskStatus.CLAIMED) {
      throw new BadRequestException('Task must be claimed to complete');
    }

    // Use centralized transition service for completion
    const updatedTask = await this.stateTransitionService.transitionToCompleted(
      taskId,
      true, // customerConfirmed
      task.executorConfirmed,
    );

    this.logger.log({
      event: 'work_confirmed',
      taskId,
      userId,
      customerConfirmed: true,
      executorConfirmed: task.executorConfirmed,
      completed: updatedTask.status === TaskStatus.COMPLETED,
      timestamp: new Date().toISOString(),
    });

    return updatedTask;
  }

  async confirmPaymentReceived(taskId: string, userId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
      relations: ['createdBy', 'claimedBy'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Only executor (claimer) can confirm payment received
    if (task.claimedById !== userId) {
      throw new ForbiddenException('Only the task executor can confirm payment');
    }

    if (task.status !== TaskStatus.CLAIMED) {
      throw new BadRequestException('Task must be claimed to complete');
    }

    // Use centralized transition service for completion
    const updatedTask = await this.stateTransitionService.transitionToCompleted(
      taskId,
      task.customerConfirmed,
      true, // executorConfirmed
    );

    this.logger.log({
      event: 'payment_confirmed',
      taskId,
      userId,
      customerConfirmed: task.customerConfirmed,
      executorConfirmed: true,
      completed: updatedTask.status === TaskStatus.COMPLETED,
      timestamp: new Date().toISOString(),
    });

    return updatedTask;
  }

  async getUserHistory(userId: string): Promise<{
    created: Task[];
    claimed: Task[];
  }> {
    const [created, claimed] = await Promise.all([
      this.tasksRepository.find({
        where: { createdById: userId },
        relations: ['createdBy', 'claimedBy'],
        order: { createdAt: 'DESC' },
      }),
      this.tasksRepository.find({
        where: { claimedById: userId },
        relations: ['createdBy', 'claimedBy'],
        order: { createdAt: 'DESC' },
      }),
    ]);

    return { created, claimed };
  }

  /**
   * Mark expired tasks (called by background job)
   * 
   * This method is called periodically to mark tasks as expired.
   * It should only be called by the scheduled job.
   * 
   * Uses centralized state transition service to ensure consistency.
   */
  async expireTasks(): Promise<number> {
    // Find tasks that should be expired
    const tasksToExpire = await this.tasksRepository
      .createQueryBuilder('task')
      .where('task.status = :status', { status: TaskStatus.CREATED })
      .andWhere('task.expiresAt < :now', { now: new Date() })
      .getMany();

    let expiredCount = 0;

    // Expire each task using centralized transition service
    for (const task of tasksToExpire) {
      try {
        await this.stateTransitionService.transition(
          task.id,
          TaskStatus.EXPIRED,
          'system', // System user for automated expiration
          'auto_expired_24h',
        );
        expiredCount++;
      } catch (error) {
        // Log but continue with other tasks
        this.logger.error({
          event: 'expire_task_failed',
          taskId: task.id,
          error: error.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    if (expiredCount > 0) {
      this.logger.log({
        event: 'tasks_expired',
        count: expiredCount,
        timestamp: new Date().toISOString(),
      });
    }

    return expiredCount;
  }
}
