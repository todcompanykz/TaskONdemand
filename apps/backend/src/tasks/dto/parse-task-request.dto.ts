import { IsString, MaxLength, MinLength } from 'class-validator';

export class ParseTaskRequestDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  freeText: string;
}
