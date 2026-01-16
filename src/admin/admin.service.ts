import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Task } from '../tasks/entities/task.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  async getUsers() {
    return this.usersRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async getTasks() {
    return this.tasksRepository.find({
      relations: ['createdBy', 'claimedBy'],
      order: { createdAt: 'DESC' },
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
        this.tasksRepository.count({ where: { status: 'created' } }),
        this.tasksRepository.count({ where: { status: 'claimed' } }),
        this.tasksRepository.count({ where: { status: 'completed' } }),
      ]);

    return {
      users: userCount,
      tasks: taskCount,
      created: createdCount,
      claimed: claimedCount,
      completed: completedCount,
    };
  }
}
