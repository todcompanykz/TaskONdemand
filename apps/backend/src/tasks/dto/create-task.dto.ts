import {
  IsString,
  IsNumber,
  IsEnum,
  Min,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  IsOptional,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { TaskUrgency } from '../entities/task.entity';

@ValidatorConstraint({ name: 'isDivisibleBy5', async: false })
export class IsDivisibleBy5Constraint implements ValidatorConstraintInterface {
  validate(value: number) {
    return value % 5 === 0;
  }

  defaultMessage() {
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

  @IsString()
  @MaxLength(100)
  city: string; // City name (e.g., "Астана")

  @IsString()
  @MaxLength(200)
  address: string; // Full address

  @IsEnum(TaskUrgency)
  urgency: TaskUrgency;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  photoUrls?: string[];
}
