import {
  IsString,
  IsNumber,
  IsEnum,
  IsLatitude,
  IsLongitude,
  Min,
  MaxLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TaskUrgency } from '../entities/task.entity';

@ValidatorConstraint({ name: 'isDivisibleBy5', async: false })
export class IsDivisibleBy5Constraint implements ValidatorConstraintInterface {
  validate(value: number, args: ValidationArguments) {
    return value % 5 === 0;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Reward must be divisible by 5';
  }
}

export class CreateTaskDto {
  @IsString()
  @MaxLength(100)
  shortDescription: string;

  @IsString()
  fullDescription: string;

  @IsNumber()
  @Min(5)
  @Validate(IsDivisibleBy5Constraint)
  reward: number; // KZT, divisible by 5 only

  @IsLongitude()
  longitude: number;

  @IsLatitude()
  latitude: number;

  @IsEnum(TaskUrgency)
  urgency: TaskUrgency;
}
