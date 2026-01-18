import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('reviews')
@Unique(['fromUserId', 'taskId'])
@Index(['toUserId'])
@Index(['taskId'])
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  fromUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'fromUserId' })
  fromUser: User;

  @Column({ type: 'uuid' })
  toUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'toUserId' })
  toUser: User;

  @Column({ type: 'uuid' })
  taskId: string;

  @ManyToOne(() => Task)
  @JoinColumn({ name: 'taskId' })
  task: Task;

  @Column({ type: 'int' })
  rating: number; // 1-5

  @Column({ type: 'varchar', length: 300, nullable: true })
  comment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
