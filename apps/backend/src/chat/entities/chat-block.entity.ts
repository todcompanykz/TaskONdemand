import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('chat_blocks')
@Index(['blockerId', 'blockedId'], { unique: true })
export class ChatBlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  blockerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blockerId' })
  blocker: User;

  @Column({ type: 'uuid' })
  blockedId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blockedId' })
  blocked: User;

  @CreateDateColumn()
  createdAt: Date;
}
