import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import { User } from '../users/entities/user.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';
import { FCMService } from '../notifications/fcm.service';
import { AdminAccessToken } from './entities/admin-access-token.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateAdminTokenDto } from './dto/create-admin-token.dto';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(AdminAccessToken)
    private adminTokenRepository: Repository<AdminAccessToken>,
    @InjectDataSource()
    private dataSource: DataSource,
    private fcmService: FCMService,
  ) {}

  async getUsers() {
    const users = await this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Calculate cancel/refuse counts and suspicious flags for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        // Count cancelled tasks (as creator)
        const cancelCount = await this.tasksRepository.count({
          where: {
            status: TaskStatus.CANCELLED,
            createdById: user.id,
          },
        });

        // Count refused tasks (as executor - tasks that were claimed then cancelled)
        const refuseCount = await this.tasksRepository.count({
          where: {
            status: TaskStatus.CANCELLED,
            claimedById: user.id,
          },
        });

        // Count created tasks
        const createdCount = await this.tasksRepository.count({
          where: { createdById: user.id },
        });

        // Count claimed tasks
        const claimedCount = await this.tasksRepository.count({
          where: { claimedById: user.id },
        });

        // Calculate suspicious flags
        const suspiciousFlags: string[] = [];
        
        if (createdCount > 0 && cancelCount / createdCount > 0.5) {
          suspiciousFlags.push('high_cancel_rate');
        }
        
        if (claimedCount > 0 && refuseCount / claimedCount > 0.5) {
          suspiciousFlags.push('high_refuse_rate');
        }
        
        if (user.isRestricted) {
          suspiciousFlags.push('restricted');
        }
        
        if (createdCount > 5) {
          const claimedTasksCount = await this.tasksRepository.count({
            where: {
              createdById: user.id,
              status: TaskStatus.CLAIMED,
            },
          });
          if (claimedTasksCount / createdCount < 0.2) {
            suspiciousFlags.push('low_claim_ratio');
          }
        }

        return {
          ...user,
          cancelCount,
          refuseCount,
          suspiciousFlags,
        };
      })
    );

    return usersWithStats;
  }

  async getTasks() {
    const tasks = await this.tasksRepository.find({
      relations: ['createdBy', 'claimedBy'],
      order: { createdAt: 'DESC' },
    });

    // Enhance tasks with lifecycle timestamps
    return tasks.map((task) => {
      const taskData: any = {
        ...task,
        createdAt: task.createdAt,
        expiresAt: task.expiresAt,
      };

      // For claimed tasks, updatedAt represents when it was claimed
      if (task.status === TaskStatus.CLAIMED) {
        taskData.claimedAt = task.updatedAt;
      }

      // For completed tasks, updatedAt represents when it was completed
      if (task.status === TaskStatus.COMPLETED) {
        taskData.completedAt = task.updatedAt;
      }

      // For cancelled tasks, updatedAt represents when it was cancelled
      if (task.status === TaskStatus.CANCELLED) {
        taskData.cancelledAt = task.updatedAt;
      }

      return taskData;
    });
  }

  async deleteTask(taskId: string) {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    await this.tasksRepository.remove(task);
    return { message: 'Task deleted' };
  }

  async getStats() {
    const [userCount, taskCount, createdCount, claimedCount, completedCount] =
      await Promise.all([
        this.usersRepository.count(),
        this.tasksRepository.count(),
        this.tasksRepository.count({ where: { status: TaskStatus.CREATED } }),
        this.tasksRepository.count({ where: { status: TaskStatus.CLAIMED } }),
        this.tasksRepository.count({ where: { status: TaskStatus.COMPLETED } }),
      ]);

    return {
      users: userCount,
      tasks: taskCount,
      created: createdCount,
      claimed: claimedCount,
      completed: completedCount,
    };
  }

  async getAnalytics() {
    // Daily metrics for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Tasks created per day
    const createdPerDay = await this.dataSource.query(`
      SELECT 
        CAST("createdAt" AS DATE) as date,
        COUNT(*)::integer as created
      FROM tasks
      WHERE "createdAt" >= $1
      GROUP BY CAST("createdAt" AS DATE)
      ORDER BY date ASC
    `, [thirtyDaysAgo]);

    // Tasks claimed per day (using updatedAt when status is CLAIMED)
    const claimedPerDay = await this.dataSource.query(`
      SELECT 
        CAST("updatedAt" AS DATE) as date,
        COUNT(*)::integer as claimed
      FROM tasks
      WHERE status = 'claimed'
        AND "updatedAt" >= $1
      GROUP BY CAST("updatedAt" AS DATE)
      ORDER BY date ASC
    `, [thirtyDaysAgo]);

    // Merge daily metrics
    const dailyMap = new Map<string, { date: string; created: number; claimed: number }>();
    
    createdPerDay.forEach((row: any) => {
      const date = row.date.toISOString().split('T')[0];
      dailyMap.set(date, { date, created: parseInt(row.created), claimed: 0 });
    });

    claimedPerDay.forEach((row: any) => {
      const date = row.date.toISOString().split('T')[0];
      const existing = dailyMap.get(date) || { date, created: 0, claimed: 0 };
      existing.claimed = parseInt(row.claimed);
      dailyMap.set(date, existing);
    });

    const dailyMetrics = Array.from(dailyMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    // Overall metrics
    const totalCreated = await this.tasksRepository.count();
    const totalClaimed = await this.tasksRepository.count({ 
      where: { status: TaskStatus.CLAIMED } 
    });
    const totalCancelled = await this.tasksRepository.count({ 
      where: { status: TaskStatus.CANCELLED } 
    });

    // Claim ratio
    const claimRatio = totalCreated > 0 ? (totalClaimed / totalCreated) * 100 : 0;

    // Cancellation rate
    const cancellationRate = totalCreated > 0 ? (totalCancelled / totalCreated) * 100 : 0;

    // Average time to claim (in minutes)
    const avgTimeResult = await this.dataSource.query(`
      SELECT 
        AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt")) / 60) as avg_minutes
      FROM tasks
      WHERE status = 'claimed'
    `);

    const averageTimeToClaim = avgTimeResult[0]?.avg_minutes 
      ? parseFloat(avgTimeResult[0].avg_minutes) 
      : 0;

    return {
      dailyMetrics,
      overallMetrics: {
        claimRatio: Math.round(claimRatio * 100) / 100,
        averageTimeToClaim: Math.round(averageTimeToClaim * 100) / 100,
        cancellationRate: Math.round(cancellationRate * 100) / 100,
      },
    };
  }

  async restrictUser(userId: string, adminId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.isRestricted = true;
    const updatedUser = await this.usersRepository.save(user);

    this.logger.warn({
      event: 'user_restricted',
      userId,
      adminId,
      timestamp: new Date().toISOString(),
    });

    // Send FCM notification
    this.fcmService.sendNotification(userId, {
      title: 'Аккаунт ограничен',
      body: 'Ваш аккаунт был ограничен администратором. Обратитесь в поддержку для получения дополнительной информации.',
      data: {
        id: `user_restricted_${userId}`,
        type: 'user_restricted',
        actionUrl: '/settings/account',
      },
    }).catch((error) => {
      this.logger.error(`Failed to send FCM notification to user ${userId}:`, error);
    });

    return updatedUser;
  }

  async unrestrictUser(userId: string, adminId: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    user.isRestricted = false;
    const updatedUser = await this.usersRepository.save(user);

    this.logger.warn({
      event: 'user_unrestricted',
      userId,
      adminId,
      timestamp: new Date().toISOString(),
    });

    // Send FCM notification
    this.fcmService.sendNotification(userId, {
      title: 'Ограничения сняты',
      body: 'Ограничения с вашего аккаунта были сняты. Вы снова можете использовать все функции приложения.',
      data: {
        id: `user_unrestricted_${userId}`,
        type: 'user_unrestricted',
        actionUrl: '/feed',
      },
    }).catch((error) => {
      this.logger.error(`Failed to send FCM notification to user ${userId}:`, error);
    });

    return updatedUser;
  }

  /**
   * Generate a random short code (6-8 characters)
   */
  private generateShortCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking chars
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Create a new admin access token (only SUPER_ADMIN)
   */
  async createAdminToken(
    createDto: CreateAdminTokenDto,
    createdById: string,
  ): Promise<AdminAccessToken> {
    const creator = await this.usersRepository.findOne({
      where: { id: createdById },
    });

    if (!creator || creator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can create admin tokens');
    }

    // Generate unique token and short code
    let token: string;
    let shortCode: string;
    let isUnique = false;

    while (!isUnique) {
      token = randomUUID();
      shortCode = this.generateShortCode();

      const existing = await this.adminTokenRepository.findOne({
        where: [{ token }, { shortCode }],
      });

      if (!existing) {
        isUnique = true;
      }
    }

    const adminToken = this.adminTokenRepository.create({
      token,
      shortCode,
      createdById,
      permissions: createDto.permissions,
      expiresAt: createDto.expiresAt ? new Date(createDto.expiresAt) : null,
      isRevoked: false,
      isActivated: false,
      assignedToUserId: createDto.assignedToUserId || null,
    });

    const saved = await this.adminTokenRepository.save(adminToken);

    // If assignedToUserId is provided, automatically activate the token for that user
    if (createDto.assignedToUserId) {
      const assignedUser = await this.usersRepository.findOne({
        where: { id: createDto.assignedToUserId },
      });

      if (!assignedUser) {
        throw new NotFoundException('Assigned user not found');
      }

      // Check if token is expired
      if (saved.expiresAt && saved.expiresAt < new Date()) {
        throw new BadRequestException('Cannot assign expired token');
      }

      // Update user role and permissions
      assignedUser.role = UserRole.ADMIN;
      assignedUser.permissions = saved.permissions;

      // Update token
      saved.isActivated = true;
      saved.assignedToUserId = createDto.assignedToUserId;
      saved.activatedAt = new Date();

      await this.usersRepository.save(assignedUser);
      await this.adminTokenRepository.save(saved);

      this.logger.log({
        event: 'admin_token_created_and_activated',
        tokenId: saved.id,
        createdById,
        assignedToUserId: createDto.assignedToUserId,
        permissions: createDto.permissions,
      });
    } else {
      this.logger.log({
        event: 'admin_token_created',
        tokenId: saved.id,
        createdById,
        permissions: createDto.permissions,
      });
    }

    return saved;
  }

  /**
   * Activate an admin token (USER can activate)
   */
  async activateAdminToken(
    tokenOrCode: string,
    userId: string,
  ): Promise<{ user: User; token: AdminAccessToken }> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Find token by UUID or shortCode
    const adminToken = await this.adminTokenRepository.findOne({
      where: [{ token: tokenOrCode }, { shortCode: tokenOrCode }],
      relations: ['createdBy'],
    });

    if (!adminToken) {
      throw new NotFoundException('Admin token not found');
    }

    if (adminToken.isRevoked) {
      throw new BadRequestException('This admin token has been revoked');
    }

    if (adminToken.isActivated) {
      throw new BadRequestException('This admin token has already been activated');
    }

    if (adminToken.expiresAt && adminToken.expiresAt < new Date()) {
      throw new BadRequestException('This admin token has expired');
    }

    // Update user role and permissions
    user.role = UserRole.ADMIN;
    user.permissions = adminToken.permissions;

    // Update token
    adminToken.isActivated = true;
    adminToken.assignedToUserId = userId;
    adminToken.activatedAt = new Date();

    await this.usersRepository.save(user);
    await this.adminTokenRepository.save(adminToken);

    this.logger.log({
      event: 'admin_token_activated',
      tokenId: adminToken.id,
      userId,
      permissions: adminToken.permissions,
    });

    return { user, token: adminToken };
  }

  /**
   * Revoke an admin token (only SUPER_ADMIN)
   */
  async revokeAdminToken(tokenId: string, revokedById: string): Promise<void> {
    const revoker = await this.usersRepository.findOne({
      where: { id: revokedById },
    });

    if (!revoker || revoker.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only SUPER_ADMIN can revoke admin tokens');
    }

    const adminToken = await this.adminTokenRepository.findOne({
      where: { id: tokenId },
      relations: ['assignedToUser'],
    });

    if (!adminToken) {
      throw new NotFoundException('Admin token not found');
    }

    adminToken.isRevoked = true;

    // If token was activated, revoke admin access from user
    if (adminToken.isActivated && adminToken.assignedToUserId) {
      const assignedUser = await this.usersRepository.findOne({
        where: { id: adminToken.assignedToUserId },
      });

      if (assignedUser) {
        assignedUser.role = UserRole.USER;
        assignedUser.permissions = [];
        await this.usersRepository.save(assignedUser);
      }
    }

    await this.adminTokenRepository.save(adminToken);

    this.logger.warn({
      event: 'admin_token_revoked',
      tokenId,
      revokedById,
      assignedToUserId: adminToken.assignedToUserId,
    });
  }

  /**
   * Get all admin tokens (only SUPER_ADMIN)
   */
  async getAdminTokens(): Promise<AdminAccessToken[]> {
    return this.adminTokenRepository.find({
      relations: ['createdBy', 'assignedToUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get all admins with their permissions (only SUPER_ADMIN)
   */
  async getAdmins(): Promise<
    Array<{
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      permissions: string[];
      tokenSource?: {
        tokenId: string;
        createdBy: string;
        createdAt: Date;
      };
    }>
  > {
    const admins = await this.usersRepository.find({
      where: [{ role: UserRole.ADMIN }, { role: UserRole.SUPER_ADMIN }],
      order: { createdAt: 'DESC' },
    });

    // Get token information for each admin
    const adminsWithTokens = await Promise.all(
      admins.map(async (admin) => {
        const token = await this.adminTokenRepository.findOne({
          where: { assignedToUserId: admin.id, isActivated: true },
          relations: ['createdBy'],
        });

        return {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          permissions: admin.permissions || [],
          tokenSource: token
            ? {
                tokenId: token.id,
                createdBy: token.createdBy.email,
                createdAt: token.createdAt,
              }
            : undefined,
        };
      }),
    );

    return adminsWithTokens;
  }
}
