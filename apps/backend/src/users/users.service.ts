import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { User } from './entities/user.entity';
import { Task, TaskStatus } from '../tasks/entities/task.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(UserNotificationSettings)
    private notificationSettingsRepository: Repository<UserNotificationSettings>,
  ) {}

  async findOne(id: string): Promise<User> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async getProfile(userId: string) {
    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'users.service.ts:24',message:'getProfile entry',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'users.service.ts:29',message:'getProfile user found',data:{userFound:!!user,hasFirstName:!!user?.firstName,hasLastName:!!user?.lastName},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Count completed tasks (as creator or executor)
    const completedTasksAsCreator = await this.tasksRepository.count({
      where: { status: TaskStatus.COMPLETED, createdById: userId },
    });
    const completedTasksAsExecutor = await this.tasksRepository.count({
      where: { status: TaskStatus.COMPLETED, claimedById: userId },
    });
    // Note: A task can be both created and claimed by same user, but in MVP we'll sum them
    const completedTasksCount = completedTasksAsCreator + completedTasksAsExecutor;

    const profile = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      ratingAvg: user.ratingAvg,
      ratingCount: user.ratingCount,
      completedTasksCount,
      createdAt: user.createdAt,
    };

    // #region agent log
    try {
      const logEntry = JSON.stringify({location:'users.service.ts:53',message:'getProfile return',data:{profileFirstName:profile.firstName,profileLastName:profile.lastName,completedTasksCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})+'\n';
      fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
    } catch(e) {}
    // #endregion

    return profile;
  }

  async updateProfile(userId: string, updateDto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if email is being changed and if it's already taken
    if (updateDto.email && updateDto.email !== user.email) {
      const existingUser = await this.findByEmail(updateDto.email);
      if (existingUser) {
        throw new ConflictException('Email already in use');
      }
    }

    // Update user fields
    if (updateDto.firstName !== undefined) user.firstName = updateDto.firstName;
    if (updateDto.lastName !== undefined) user.lastName = updateDto.lastName;
    if (updateDto.email !== undefined) user.email = updateDto.email;
    if (updateDto.phoneNumber !== undefined) user.phoneNumber = updateDto.phoneNumber;

    await this.usersRepository.save(user);

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };
  }

  async getNotificationSettings(userId: string) {
    let settings = await this.notificationSettingsRepository.findOne({
      where: { userId },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = this.notificationSettingsRepository.create({
        userId,
        // All defaults are true
      });
      settings = await this.notificationSettingsRepository.save(settings);
    }

    return settings;
  }

  async updateNotificationSettings(userId: string, updateDto: UpdateNotificationSettingsDto) {
    let settings = await this.notificationSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      settings = this.notificationSettingsRepository.create({
        userId,
        ...updateDto,
      });
    } else {
      Object.assign(settings, updateDto);
    }

    return await this.notificationSettingsRepository.save(settings);
  }
}
