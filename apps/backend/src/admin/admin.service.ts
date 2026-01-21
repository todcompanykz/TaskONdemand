import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectDataSource()
    private dataSource: DataSource,
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

    return updatedUser;
  }
}
