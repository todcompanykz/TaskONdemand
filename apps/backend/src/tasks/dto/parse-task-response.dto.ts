import { TaskUrgency } from '../entities/task.entity';

export class ParseTaskResponseDto {
  shortDescription: string;
  fullDescription: string;
  city: string;
  address: string;
  urgency: TaskUrgency;
  rewardSuggestion?: number;
  needsUserClarification: boolean;
  clarificationQuestion?: string;
  missingFields: string[];
  canSubmit: boolean;
  rewriteQualityNote?: string;
}
