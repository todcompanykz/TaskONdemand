import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, IsolationLevel } from 'typeorm';
import { Task, TaskStatus, TaskUrgency } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStateMachine } from './task-state-machine';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private redisService: RedisService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: string): Promise<Task> {
    // Validate reward is divisible by 5
    if (createTaskDto.reward % 5 !== 0) {
      throw new BadRequestException('Reward must be divisible by 5');
    }

    // Create PostGIS Point (longitude, latitude)
    const geoPoint = `POINT(${createTaskDto.longitude} ${createTaskDto.latitude})`;

    // Set expiration to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const task = this.tasksRepository.create({
      shortDescription: createTaskDto.shortDescription,
      fullDescription: createTaskDto.fullDescription,
      reward: createTaskDto.reward,
      geoPoint,
      urgency: createTaskDto.urgency,
      createdById: userId,
      status: TaskStatus.CREATED,
      expiresAt,
    });

    return this.tasksRepository.save(task);
  }

  async getFeed(
    longitude: number,
    latitude: number,
    userId: string,
  ): Promise<Task[]> {
    // Fixed radius: 1 km
    const radiusMeters = 1000;

    // PostGIS query: ST_DWithin with geography for accurate distance
    const tasks = await this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .where('task.status = :status', { status: TaskStatus.CREATED })
      .andWhere('task.expiresAt > :now', { now: new Date() })
      .andWhere(
        `ST_DWithin(
          task.geoPoint::geography,
          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
          :radius
        )`,
        { longitude, latitude, radius: radiusMeters },
      )
      .orderBy('task.createdAt', 'DESC')
      .getMany();

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
   * Atomic claim implementation using database transaction with pessimistic locking
   * 
   * This method ensures that only one user can claim a task, even under high concurrency.
   * 
   * Key features:
   * 1. Transaction isolation: READ COMMITTED (default) with pessimistic write lock
   * 2. Row-level locking: Prevents concurrent claims on the same task
   * 3. State validation: Ensures task is in claimable state
   * 4. Business rules: Prevents self-claiming and expired tasks
   * 
   * @param taskId - UUID of the task to claim
   * @param userId - UUID of the user claiming the task
   * @returns The claimed task with updated status and claimedBy
   * @throws NotFoundException if task doesn't exist
   * @throws BadRequestException if task cannot be claimed
   * @throws ForbiddenException if user is blocked from claiming
   * @throws ConflictException if task is already claimed (race condition handled)
   */
  async claimTask(taskId: string, userId: string): Promise<Task> {
    // Pre-transaction check: Blocked users (fast fail)
    const blockKey = `claim_block:${userId}`;
    const isBlocked = await this.redisService.exists(blockKey);
    if (isBlocked) {
      this.logger.warn(`User ${userId} attempted to claim task ${taskId} but is blocked`);
      throw new ForbiddenException(
        'You are temporarily blocked from claiming tasks',
      );
    }

    // Retry logic for potential deadlocks (PostgreSQL can have deadlocks with locks)
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.dataSource.transaction(
          {
            isolation: IsolationLevel.READ_COMMITTED, // Explicit isolation level
          },
          async (manager) => {
            const taskRepository = manager.getRepository(Task);

            // CRITICAL: Pessimistic write lock prevents concurrent claims
            // This SELECT ... FOR UPDATE locks the row until transaction commits/rolls back
            const task = await taskRepository.findOne({
              where: { id: taskId },
              lock: { mode: 'pessimistic_write' }, // Row-level exclusive lock
              relations: ['createdBy', 'claimedBy'],
            });

            if (!task) {
              throw new NotFoundException('Task not found');
            }

            // Validate state transition BEFORE any modifications
            if (!TaskStateMachine.canBeClaimed(task.status)) {
              this.logger.warn(
                `Task ${taskId} cannot be claimed. Current status: ${task.status}`,
              );
              throw new BadRequestException(
                `Task cannot be claimed. Current status: ${task.status}`,
              );
            }

            // Check if task is expired (handle in transaction to ensure consistency)
            if (task.expiresAt && task.expiresAt < new Date()) {
              this.logger.info(`Task ${taskId} expired, marking as expired`);
              task.status = TaskStatus.EXPIRED;
              await taskRepository.save(task);
              throw new BadRequestException('Task has expired');
            }

            // Business rule: Cannot claim own task
            if (task.createdById === userId) {
              throw new BadRequestException('You cannot claim your own task');
            }

            // Double-check: Another transaction might have claimed it (edge case)
            // The lock should prevent this, but we check for extra safety
            if (task.claimedById !== null) {
              this.logger.warn(
                `Task ${taskId} already claimed by ${task.claimedById} (race condition detected)`,
              );
              throw new ConflictException('Task has already been claimed');
            }

            // ATOMIC UPDATE: Both fields updated in single operation
            task.status = TaskStatus.CLAIMED;
            task.claimedById = userId;
            const savedTask = await taskRepository.save(task);

            this.logger.log(
              `Task ${taskId} successfully claimed by user ${userId}`,
            );

            return savedTask;
          },
        );
      } catch (error) {
        lastError = error;

        // Retry on deadlock (PostgreSQL error code: 40P01)
        if (
          error.code === '40P01' &&
          attempt < maxRetries
        ) {
          const delay = Math.pow(2, attempt) * 100; // Exponential backoff: 200ms, 400ms
          this.logger.warn(
            `Deadlock detected on claim attempt ${attempt}, retrying in ${delay}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Re-throw known exceptions
        if (
          error instanceof NotFoundException ||
          error instanceof BadRequestException ||
          error instanceof ForbiddenException ||
          error instanceof ConflictException
        ) {
          throw error;
        }

        // Unknown error: log and re-throw
        this.logger.error(
          `Unexpected error claiming task ${taskId} by user ${userId}:`,
          error.stack,
        );
        throw error;
      }
    }

    // If we exhausted retries, throw last error
    throw lastError || new Error('Failed to claim task after retries');
  }

  async cancelTask(taskId: string, userId: string): Promise<Task> {
    // Check cancel/refuse rate limit
    const cancelKey = `cancel_count:${userId}:${new Date().toISOString().split('T')[0]}`;
    const cancelCount = await this.redisService.increment(cancelKey);
    
    if (cancelCount === 1) {
      // Set expiry for the counter (24 hours)
      await this.redisService.setWithExpiry(cancelKey, '1', 86400);
    }

    if (cancelCount > 3) {
      // Block user from claiming for 24 hours
      await this.redisService.setWithExpiry(`claim_block:${userId}`, '1', 86400);
      throw new ForbiddenException(
        'You have exceeded the cancel limit. Claiming is blocked for 24 hours.',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(Task);

      const task = await taskRepository.findOne({
        where: { id: taskId },
        relations: ['createdBy', 'claimedBy'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Only creator can cancel
      if (task.createdById !== userId) {
        throw new ForbiddenException('Only the task creator can cancel');
      }

      if (!TaskStateMachine.canBeCancelled(task.status)) {
        throw new BadRequestException(
          `Task cannot be cancelled. Current status: ${task.status}`,
        );
      }

      task.status = TaskStatus.CANCELLED;
      await taskRepository.save(task);

      return task;
    });
  }

  async refuseTask(taskId: string, userId: string): Promise<Task> {
    // Check cancel/refuse rate limit
    const refuseKey = `refuse_count:${userId}:${new Date().toISOString().split('T')[0]}`;
    const refuseCount = await this.redisService.increment(refuseKey);
    
    if (refuseCount === 1) {
      await this.redisService.setWithExpiry(refuseKey, '1', 86400);
    }

    if (refuseCount > 3) {
      await this.redisService.setWithExpiry(`claim_block:${userId}`, '1', 86400);
      throw new ForbiddenException(
        'You have exceeded the refuse limit. Claiming is blocked for 24 hours.',
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(Task);

      const task = await taskRepository.findOne({
        where: { id: taskId },
        relations: ['createdBy', 'claimedBy'],
      });

      if (!task) {
        throw new NotFoundException('Task not found');
      }

      // Only executor (claimer) can refuse
      if (task.claimedById !== userId) {
        throw new ForbiddenException('Only the task executor can refuse');
      }

      if (task.status !== TaskStatus.CLAIMED) {
        throw new BadRequestException(
          `Task cannot be refused. Current status: ${task.status}`,
        );
      }

      task.status = TaskStatus.CANCELLED;
      task.claimedById = null;
      await taskRepository.save(task);

      return task;
    });
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

    task.customerConfirmed = true;

    // If both confirmed, mark as completed
    if (task.customerConfirmed && task.executorConfirmed) {
      task.status = TaskStatus.COMPLETED;
    }

    return this.tasksRepository.save(task);
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

    task.executorConfirmed = true;

    // If both confirmed, mark as completed
    if (task.customerConfirmed && task.executorConfirmed) {
      task.status = TaskStatus.COMPLETED;
    }

    return this.tasksRepository.save(task);
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
   * Mark expired tasks (run as scheduled job)
   */
  async expireTasks(): Promise<void> {
    await this.tasksRepository
      .createQueryBuilder()
      .update(Task)
      .set({ status: TaskStatus.EXPIRED })
      .where('status = :status', { status: TaskStatus.CREATED })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();
  }
}
