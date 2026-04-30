import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

export enum ChatConversationStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  DECLINED = 'declined',
}

@Entity('chat_conversations')
@Index(['userAId', 'userBId'], { unique: true })
@Index(['status', 'lastMessageAt'])
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userAId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userAId' })
  userA: User;

  @Column({ type: 'uuid' })
  userBId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userBId' })
  userB: User;

  @Column({ type: 'uuid' })
  requestedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'requestedById' })
  requestedBy: User;

  @Column({
    type: 'varchar',
    length: 20,
    default: ChatConversationStatus.PENDING,
  })
  status: ChatConversationStatus;

  @Column({ type: 'uuid', nullable: true })
  declinedById: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastMessagePreview: string | null;

  @Column({ type: 'timestamp', nullable: true })
  lastMessageAt: Date | null;

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
