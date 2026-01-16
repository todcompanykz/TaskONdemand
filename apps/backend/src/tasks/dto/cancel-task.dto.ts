import { IsUUID } from 'class-validator';

export class CancelTaskDto {
  @IsUUID()
  taskId: string;
}
