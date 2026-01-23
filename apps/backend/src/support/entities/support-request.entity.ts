import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('support_requests')
export class SupportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  topic: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'open' })
  status: 'open' | 'answered';

  @Column({ type: 'text', nullable: true })
  responseMessage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  answeredAt: Date | null;

  @Column({ type: 'uuid', nullable: true })
  respondedByAdminId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'respondedByAdminId' })
  respondedByAdmin: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
