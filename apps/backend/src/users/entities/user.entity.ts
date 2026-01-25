import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { Review } from '../../reviews/entities/review.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string; // bcrypt hashed

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phoneNumber: string; // stored only, no SMS

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0 })
  ratingAvg: number; // 0.00 - 5.00

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @Column({ type: 'boolean', default: false })
  isRestricted: boolean;

  @Column({ nullable: true, type: 'text' })
  fcmToken: string | null; // Firebase Cloud Messaging token for push notifications

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Task, (task) => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Task, (task) => task.claimedBy)
  claimedTasks: Task[];

  @OneToMany(() => Review, (review) => review.fromUser)
  reviewsGiven: Review[];

  @OneToMany(() => Review, (review) => review.toUser)
  reviewsReceived: Review[];
}
