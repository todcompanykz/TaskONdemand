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
import { ChatConversation } from './chat-conversation.entity';

@Entity('chat_messages')
@Index(['conversationId', 'createdAt'])
@Index(['conversationId', 'recipientReadAt'])
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  conversationId: string;

  @ManyToOne(() => ChatConversation, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'conversationId' })
  conversation: ChatConversation;

  @Column({ type: 'uuid' })
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  recipientReadAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
