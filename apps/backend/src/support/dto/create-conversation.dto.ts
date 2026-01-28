import { IsEnum, IsString, MinLength } from 'class-validator';
import { SupportTopic } from '../entities/support-conversation.entity';

export class CreateConversationDto {
  @IsEnum(SupportTopic)
  topic: SupportTopic;

  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  message: string;
}
