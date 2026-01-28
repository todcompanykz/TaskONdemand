import { IsEnum, IsOptional } from 'class-validator';
import {
  ConversationStatus,
  ConversationPriority,
} from '../entities/support-conversation.entity';

export class UpdateConversationDto {
  @IsOptional()
  @IsEnum(ConversationStatus)
  status?: ConversationStatus;

  @IsOptional()
  @IsEnum(ConversationPriority)
  priority?: ConversationPriority;
}
