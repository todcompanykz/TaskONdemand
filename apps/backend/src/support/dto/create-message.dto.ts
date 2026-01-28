import { IsString, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MinLength(1, { message: 'Message cannot be empty' })
  message: string;
}
