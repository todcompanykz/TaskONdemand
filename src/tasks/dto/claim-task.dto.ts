import { IsUUID } from 'class-validator';

export class ClaimTaskDto {
  @IsUUID()
  taskId: string;
}
