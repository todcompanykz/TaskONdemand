import { IsString, IsNotEmpty } from 'class-validator';

export class ActivateAdminTokenDto {
  @IsString()
  @IsNotEmpty()
  token: string; // Can be UUID or shortCode
}
