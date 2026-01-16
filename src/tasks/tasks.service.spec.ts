import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TasksService } from './tasks.service';
import { Task, TaskStatus } from './entities/task.entity';
import { User } from '../users/entities/user.entity';
import { RedisService } from '../redis/redis.service';
import { NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';

describe('TasksService - Atomic Claim Logic', () => {
  let service: TasksService;
  let taskRepository: jest.Mocked<Repository<Task>>;
  let userRepository: jest.Mocked<Repository<User>>;
  let dataSource: jest.Mocked<DataSource>;
  let redisService: jest.Mocked<RedisService>;

  const mockTask: Task = {
    id: 'task-1',
    shortDescription: 'Test Task',
    fullDescription: 'Test Description',
    reward: 1000,
    geoPoint: 'POINT(71.4304 51.1694)',
    urgency: 'medium' as any,
    status: TaskStatus.CREATED,
    createdById: 'user-1',
    createdBy: { id: 'user-1', email: 'creator@test.com' } as User,
    claimedById: null,
    claimedBy: null,
    customerConfirmed: false,
    executorConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
  };

  beforeEach(async () => {
    const mockTransaction = jest.fn();
    const mockManager = {
      getRepository: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn((callback) => {
              return callback(mockManager);
            }),
          },
        },
        {
          provide: RedisService,
          useValue: {
            exists: jest.fn(),
            increment: jest.fn(),
            setWithExpiry: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
    taskRepository = module.get(getRepositoryToken(Task));
    userRepository = module.get(getRepositoryToken(User));
    dataSource = module.get(DataSource);
    redisService = module.get(RedisService);

    // Setup default mocks
    mockManager.getRepository.mockReturnValue(taskRepository);
    redisService.exists.mockResolvedValue(false);
  });

  describe('claimTask - Atomic Transaction', () => {
    it('should successfully claim a task atomically', async () => {
      // Arrange
      const userId = 'user-2';
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue({
        ...mockTask,
        status: TaskStatus.CLAIMED,
        claimedById: userId,
      });

      // Act
      const result = await service.claimTask('task-1', userId);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        lock: { mode: 'pessimistic_write' }, // Critical: pessimistic lock
        relations: ['createdBy', 'claimedBy'],
      });
      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: TaskStatus.CLAIMED,
          claimedById: userId,
        }),
      );
      expect(result.status).toBe(TaskStatus.CLAIMED);
      expect(result.claimedById).toBe(userId);
    });

    it('should prevent claiming if user is blocked', async () => {
      // Arrange
      redisService.exists.mockResolvedValue(true);

      // Act & Assert
      await expect(service.claimTask('task-1', 'user-2')).rejects.toThrow(
        ForbiddenException,
      );
      expect(dataSource.transaction).not.toHaveBeenCalled();
    });

    it('should prevent claiming own task', async () => {
      // Arrange
      const userId = 'user-1'; // Same as creator
      taskRepository.findOne.mockResolvedValue(mockTask);

      // Act & Assert
      await expect(service.claimTask('task-1', userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(taskRepository.save).not.toHaveBeenCalled();
    });

    it('should prevent claiming already claimed task', async () => {
      // Arrange
      const userId = 'user-2';
      const alreadyClaimedTask = {
        ...mockTask,
        status: TaskStatus.CLAIMED,
        claimedById: 'user-3',
      };
      taskRepository.findOne.mockResolvedValue(alreadyClaimedTask);

      // Act & Assert
      await expect(service.claimTask('task-1', userId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle expired tasks', async () => {
      // Arrange
      const userId = 'user-2';
      const expiredTask = {
        ...mockTask,
        expiresAt: new Date(Date.now() - 1000), // Expired
      };
      taskRepository.findOne.mockResolvedValue(expiredTask);
      taskRepository.save.mockResolvedValue({
        ...expiredTask,
        status: TaskStatus.EXPIRED,
      });

      // Act & Assert
      await expect(service.claimTask('task-1', userId)).rejects.toThrow(
        BadRequestException,
      );
      expect(taskRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: TaskStatus.EXPIRED }),
      );
    });

    it('should handle race condition (task claimed between lock and update)', async () => {
      // Arrange
      const userId = 'user-2';
      const taskWithClaimer = {
        ...mockTask,
        claimedById: 'user-3', // Already claimed by someone else
      };
      taskRepository.findOne.mockResolvedValue(taskWithClaimer);

      // Act & Assert
      await expect(service.claimTask('task-1', userId)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw NotFoundException if task does not exist', async () => {
      // Arrange
      taskRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.claimTask('non-existent', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use pessimistic write lock for concurrency safety', async () => {
      // Arrange
      const userId = 'user-2';
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      // Act
      await service.claimTask('task-1', userId);

      // Assert - Verify lock mode is used
      expect(taskRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });
  });

  describe('Transaction Isolation', () => {
    it('should execute claim within a transaction', async () => {
      // Arrange
      const userId = 'user-2';
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      // Act
      await service.claimTask('task-1', userId);

      // Assert
      expect(dataSource.transaction).toHaveBeenCalled();
      const transactionCallback = dataSource.transaction.mock.calls[0][0];
      expect(typeof transactionCallback).toBe('function');
    });
  });
});
