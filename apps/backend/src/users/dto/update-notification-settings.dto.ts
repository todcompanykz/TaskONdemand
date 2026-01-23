import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateNotificationSettingsDto {
  // System notifications (cannot be fully disabled, but can be set to false for some)
  @IsOptional()
  @IsBoolean()
  loginFromNewDevice?: boolean;

  @IsOptional()
  @IsBoolean()
  passwordChange?: boolean;

  @IsOptional()
  @IsBoolean()
  securityErrors?: boolean;

  @IsOptional()
  @IsBoolean()
  accountBlocked?: boolean;

  // Account and profile
  @IsOptional()
  @IsBoolean()
  profileChanges?: boolean;

  @IsOptional()
  @IsBoolean()
  actionConfirmation?: boolean;

  @IsOptional()
  @IsBoolean()
  sessionExpiration?: boolean;

  // Work/Service notifications
  @IsOptional()
  @IsBoolean()
  newMessages?: boolean;

  @IsOptional()
  @IsBoolean()
  newTasks?: boolean;

  @IsOptional()
  @IsBoolean()
  taskStatusChange?: boolean;

  @IsOptional()
  @IsBoolean()
  taskComments?: boolean;

  @IsOptional()
  @IsBoolean()
  executorAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  supportReplies?: boolean;
}
