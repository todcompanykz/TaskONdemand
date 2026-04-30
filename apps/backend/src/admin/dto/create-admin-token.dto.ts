import {
  IsArray,
  IsOptional,
  IsDateString,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isValidPermission } from '../../common/enums/permissions.enum';

@ValidatorConstraint({ name: 'isValidPermissions', async: false })
class IsValidPermissionsConstraint implements ValidatorConstraintInterface {
  validate(permissions: string[]) {
    if (!Array.isArray(permissions)) {
      return false;
    }
    const invalidPermissions = permissions.filter((p) => !isValidPermission(p));
    return invalidPermissions.length === 0;
  }

  defaultMessage(args: ValidationArguments) {
    const invalidPermissions = (args.value as string[]).filter(
      (p) => !isValidPermission(p),
    );
    return `Invalid permissions: ${invalidPermissions.join(', ')}`;
  }
}

export class CreateAdminTokenDto {
  @IsArray()
  @IsString({ each: true })
  @Validate(IsValidPermissionsConstraint)
  permissions: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsString()
  assignedToUserId?: string; // If provided, token will be automatically activated for this user
}
