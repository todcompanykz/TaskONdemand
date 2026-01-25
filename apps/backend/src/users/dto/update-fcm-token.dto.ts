import { IsString, IsOptional, ValidateIf } from 'class-validator';

export class UpdateFCMTokenDto {
  @ValidateIf((o) => o.token !== null)
  @IsOptional()
  @IsString()
  token: string | null;
}
