import { TaskStatus } from './entities/task.entity';

/**
 * Task State Machine
 * 
 * Valid transitions:
 * - created -> claimed
 * - created -> cancelled (by creator)
 * - created -> expired (after 24h)
 * - claimed -> completed (both confirm)
 * - claimed -> cancelled (by creator or executor)
 */
export class TaskStateMachine {
  private static readonly VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    [TaskStatus.CREATED]: [TaskStatus.CLAIMED, TaskStatus.CANCELLED, TaskStatus.EXPIRED],
    [TaskStatus.CLAIMED]: [TaskStatus.COMPLETED, TaskStatus.CANCELLED],
    [TaskStatus.COMPLETED]: [], // terminal state
    [TaskStatus.CANCELLED]: [], // terminal state
    [TaskStatus.EXPIRED]: [], // terminal state
  };

  static canTransition(from: TaskStatus, to: TaskStatus): boolean {
    const allowed = this.VALID_TRANSITIONS[from] || [];
    return allowed.includes(to);
  }

  static validateTransition(from: TaskStatus, to: TaskStatus): void {
    if (!this.canTransition(from, to)) {
      throw new Error(
        `Invalid state transition from ${from} to ${to}`,
      );
    }
  }

  static isTerminal(status: TaskStatus): boolean {
    return (
      status === TaskStatus.COMPLETED ||
      status === TaskStatus.CANCELLED ||
      status === TaskStatus.EXPIRED
    );
  }

  static canBeClaimed(status: TaskStatus): boolean {
    return status === TaskStatus.CREATED;
  }

  static canBeCancelled(status: TaskStatus): boolean {
    return status === TaskStatus.CREATED || status === TaskStatus.CLAIMED;
  }

  static canBeCompleted(status: TaskStatus): boolean {
    return status === TaskStatus.CLAIMED;
  }
}
