import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { SupportMessage } from './support-message.entity';

export enum SupportTopic {
  TASK_ISSUE = 'task_issue',
  ACCOUNT_ACCESS = 'account_access',
  RESTRICTION_BLOCK = 'restriction_block',
  OTHER = 'other',
}

export enum ConversationStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

export enum ConversationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

@Entity('support_conversations')
@Index(['userId', 'createdAt'])
@Index(['status', 'priority', 'lastMessageAt'])
export class SupportConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  topic: SupportTopic;

  @Column({ type: 'varchar', length: 20, default: ConversationStatus.OPEN })
  status: ConversationStatus;

  @Column({
    type: 'varchar',
    length: 20,
    default: ConversationPriority.NORMAL,
  })
  priority: ConversationPriority;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @OneToMany(() => SupportMessage, (message) => message.conversation, {
    cascade: true,
  })
  messages: SupportMessage[];
}
