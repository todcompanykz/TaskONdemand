import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task, TaskStatus } from './entities/task.entity';
import { TaskStateMachine } from './task-state-machine';

/**
 * Centralized Task State Transition Service
 * 
 * ALL task status changes MUST go through this service.
 * This ensures:
 * - Consistent state transitions
 * - Proper validation
 * - Audit logging
 * - No race conditions
 */
@Injectable()
export class TaskStateTransitionService {
  private readonly logger = new Logger(TaskStateTransitionService.name);

  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    private dataSource: DataSource,
  ) {}

  /**
   * Transition task to new status
   * 
   * This is the ONLY method that should change task.status
   * All other services must use this method.
   * 
   * @param taskId - Task ID
   * @param newStatus - Target status
   * @param userId - User performing the transition (for logging)
   * @param reason - Optional reason for transition
   * @returns Updated task
   */
  async transition(
    taskId: string,
    newStatus: TaskStatus,
    userId: string,
    reason?: string,
  ): Promise<Task> {
    return await this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(Task);

      // Lock the task row to prevent concurrent modifications
      const task = await taskRepository.findOne({
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!task) {
        throw new BadRequestException(`Task ${taskId} not found`);
      }

      const oldStatus = task.status;

      // Validate transition using state machine
      TaskStateMachine.validateTransition(oldStatus, newStatus);

      // Check if task is already in terminal state
      if (TaskStateMachine.isTerminal(task.status)) {
        throw new BadRequestException(
          `Cannot transition task ${taskId} from terminal state ${task.status} to ${newStatus}`,
        );
      }

      // Perform transition
      task.status = newStatus;

      // Handle status-specific logic
      if (newStatus === TaskStatus.EXPIRED) {
        // Expired tasks: no additional changes needed
      } else if (newStatus === TaskStatus.CANCELLED) {
        // Cancelled tasks: clear claimedBy if it was claimed
        if (oldStatus === TaskStatus.CLAIMED) {
          task.claimedById = null;
        }
      }

      const savedTask = await taskRepository.save(task);

      // Structured logging
      this.logger.log({
        event: 'task_status_transition',
        taskId,
        userId,
        oldStatus,
        newStatus,
        reason: reason || 'manual',
        timestamp: new Date().toISOString(),
      });

      return savedTask;
    });
  }

  /**
   * Transition to CLAIMED status (special case with claimedBy)
   */
  async transitionToClaimed(
    taskId: string,
    userId: string,
  ): Promise<Task> {
    return await this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(Task);

      // #region agent log
      try {
        const fs = require('fs');
        const path = require('path');
        const logEntry = JSON.stringify({location:'task-state-transition.service.ts:114',message:'transitionToClaimed entry',data:{taskId,userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
        fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
      } catch(e) {}
      // #endregion

      // Lock task WITHOUT relations to avoid "FOR UPDATE on nullable side of outer join" error
      // Relations are not needed for atomic claim operation
      const task = await taskRepository.findOne({
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
        // Remove relations to avoid LEFT JOIN that conflicts with FOR UPDATE
      });

      // #region agent log
      try {
        const fs = require('fs');
        const path = require('path');
        const logEntry = JSON.stringify({location:'task-state-transition.service.ts:119',message:'transitionToClaimed task found',data:{taskFound:!!task,taskStatus:task?.status,taskCreatedById:task?.createdById,taskClaimedById:task?.claimedById},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
        fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
      } catch(e) {}
      // #endregion

      if (!task) {
        throw new BadRequestException(`Task ${taskId} not found`);
      }

      // Validate transition
      TaskStateMachine.validateTransition(task.status, TaskStatus.CLAIMED);

      // Business rules
      if (task.createdById === userId) {
        throw new BadRequestException('You cannot claim your own task');
      }

      if (task.claimedById !== null) {
        throw new BadRequestException('Task is already claimed');
      }

      // Check expiration
      if (task.expiresAt && task.expiresAt < new Date()) {
        // Auto-expire in same transaction
        task.status = TaskStatus.EXPIRED;
        await taskRepository.save(task);
        throw new BadRequestException('Task has expired');
      }

      // Perform claim transition
      task.status = TaskStatus.CLAIMED;
      task.claimedById = userId;
      const savedTask = await taskRepository.save(task);

      // #region agent log
      try {
        const fs = require('fs');
        const path = require('path');
        const logEntry = JSON.stringify({location:'task-state-transition.service.ts:150',message:'transitionToClaimed success',data:{taskId,taskStatus:savedTask.status,taskClaimedById:savedTask.claimedById},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})+'\n';
        fs.appendFileSync(path.join(process.cwd(),'.cursor','debug.log'),logEntry);
      } catch(e) {}
      // #endregion

      // Structured logging
      this.logger.log({
        event: 'task_claimed',
        taskId,
        userId,
        claimedById: userId,
        reward: task.reward,
        timestamp: new Date().toISOString(),
      });

      return savedTask;
    });
  }

  /**
   * Transition to COMPLETED status (requires both confirmations)
   */
  async transitionToCompleted(
    taskId: string,
    customerConfirmed: boolean,
    executorConfirmed: boolean,
  ): Promise<Task> {
    return await this.dataSource.transaction(async (manager) => {
      const taskRepository = manager.getRepository(Task);

      const task = await taskRepository.findOne({
        where: { id: taskId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!task) {
        throw new BadRequestException(`Task ${taskId} not found`);
      }

      // Validate current status
      if (task.status !== TaskStatus.CLAIMED) {
        throw new BadRequestException(
          `Task must be in CLAIMED status to complete. Current: ${task.status}`,
        );
      }

      // Update confirmations
      task.customerConfirmed = customerConfirmed;
      task.executorConfirmed = executorConfirmed;

      // Only transition if both confirmed
      if (customerConfirmed && executorConfirmed) {
        TaskStateMachine.validateTransition(task.status, TaskStatus.COMPLETED);
        task.status = TaskStatus.COMPLETED;

        // Structured logging
        this.logger.log({
          event: 'task_completed',
          taskId,
          reward: task.reward,
          createdById: task.createdById,
          claimedById: task.claimedById,
          timestamp: new Date().toISOString(),
        });
      }

      return await taskRepository.save(task);
    });
  }
}
