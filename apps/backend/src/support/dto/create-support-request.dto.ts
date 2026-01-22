import { IsEnum, IsString, MinLength } from 'class-validator';

export enum SupportTopic {
  TASK_ISSUE = 'task_issue',
  ACCOUNT_ACCESS = 'account_access',
  RESTRICTION_BLOCK = 'restriction_block',
  OTHER = 'other',
}

export class CreateSupportRequestDto {
  @IsEnum(SupportTopic)
  topic: SupportTopic;

  @IsString()
  @MinLength(10, { message: 'Message must be at least 10 characters long' })
  message: string;
}
