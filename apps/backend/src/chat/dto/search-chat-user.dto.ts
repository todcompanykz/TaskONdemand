import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SearchChatUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  query: string;
}
