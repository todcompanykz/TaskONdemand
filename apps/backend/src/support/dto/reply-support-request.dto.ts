import { IsString, MinLength } from 'class-validator';

export class ReplySupportRequestDto {
  @IsString()
  @MinLength(10, { message: 'Response message must be at least 10 characters long' })
  message: string;
}
