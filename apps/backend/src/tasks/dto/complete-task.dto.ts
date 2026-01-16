import { IsUUID, IsBoolean } from 'class-validator';

export class CompleteTaskDto {
  @IsUUID()
  taskId: string;

  @IsBoolean()
  customerConfirmed: boolean;

  @IsBoolean()
  executorConfirmed: boolean;
}
