# Business Logic Hardening - Improvements

## Summary

This document describes the improvements made to harden business logic, eliminate race conditions, and align code with requirements.

## 1. Centralized Task State Machine ✅

### Implementation
- **File**: `apps/backend/src/tasks/task-state-transition.service.ts`
- **Purpose**: Single point of control for ALL task status changes

### Key Features
- All status transitions go through `TaskStateTransitionService`
- Validates transitions using `TaskStateMachine`
- Uses database transactions with pessimistic locking
- Structured logging for all transitions

### Valid Transitions (Enforced)
```
created → claimed
created → cancelled
created → expired
claimed → completed
claimed → cancelled
```

### Usage
```typescript
// All status changes MUST use this service
await stateTransitionService.transition(taskId, TaskStatus.CANCELLED, userId, 'reason');
await stateTransitionService.transitionToClaimed(taskId, userId);
await stateTransitionService.transitionToCompleted(taskId, customerConfirmed, executorConfirmed);
```

## 2. Atomic Claim (Database Level) ✅

### Implementation
- **File**: `apps/backend/src/tasks/task-state-transition.service.ts` (transitionToClaimed)
- **Method**: Uses PostgreSQL transaction + SELECT FOR UPDATE

### Key Features
- Pessimistic write lock (`SELECT ... FOR UPDATE`)
- Transaction isolation ensures atomicity
- Prevents double-claim under concurrent load
- Validates state before transition
- Checks expiration in same transaction

### Database Constraint
- Status enum constraint in schema
- Additional CHECK constraint in migration

## 3. Cancel/Refuse Limits (Redis) ✅

### Implementation
- **File**: `apps/backend/src/tasks/services/rate-limit.service.ts`
- **Guard**: `apps/backend/src/tasks/guards/claim-block.guard.ts`

### Key Features
- Redis-based rate limiting
- Key pattern: `user:{id}:cancel_count:{date}` and `user:{id}:refuse_count:{date}`
- Max 3 cancels OR refuses per 24h
- After limit: blocks claim for 24h
- Reusable guard for claim endpoint

### Usage
```typescript
// Applied automatically via guard
@Post('claim')
@UseGuards(ClaimBlockGuard)
async claimTask(...) { ... }

// Or manually in service
const limitExceeded = await rateLimitService.checkAndIncrementCancel(userId);
```

## 4. Expired Tasks Job ✅

### Implementation
- **File**: `apps/backend/src/tasks/tasks.scheduler.ts`
- **Schedule**: Every 5 minutes (configurable)

### Key Features
- Uses NestJS Schedule module (`@nestjs/schedule`)
- Runs `@Cron(CronExpression.EVERY_5_MINUTES)`
- Marks tasks as expired if:
  - status = CREATED
  - createdAt > 24h ago (via expiresAt field)
- Uses centralized state transition service
- Structured logging

### Configuration
- Schedule interval: 5 minutes (can be changed in `tasks.scheduler.ts`)
- Uses `CronExpression.EVERY_5_MINUTES`

## 5. API Contract Cleanup ✅

### DTOs Created
- `CreateTaskDto` - Already existed, validates reward divisible by 5
- `ClaimTaskDto` - Validates taskId (UUID)
- `CancelTaskDto` - New (for future use)
- `CompleteTaskDto` - New (for future use)

### Validation
- Reward divisible by 5 (DTO + service double-check)
- Status transitions validated by state machine
- UUID validation for task IDs

## 6. Health & Observability ✅

### Health Endpoint
- **Route**: `GET /health`
- **File**: `apps/backend/src/health/health.controller.ts`
- **Checks**:
  - Database connectivity
  - Memory usage (heap & RSS)
  - Redis connectivity

### Structured Logging
All critical operations log structured events:

**Claim Events:**
```json
{
  "event": "task_claimed",
  "taskId": "...",
  "userId": "...",
  "reward": 1000,
  "timestamp": "..."
}
```

**Cancel Events:**
```json
{
  "event": "task_cancelled",
  "taskId": "...",
  "userId": "...",
  "previousStatus": "created",
  "timestamp": "..."
}
```

**Complete Events:**
```json
{
  "event": "task_completed",
  "taskId": "...",
  "reward": 1000,
  "createdById": "...",
  "claimedById": "...",
  "timestamp": "..."
}
```

**Expire Events:**
```json
{
  "event": "tasks_expired",
  "count": 5,
  "timestamp": "..."
}
```

## Architecture Changes

### Before
- Status changes scattered across service methods
- Direct `task.status = ...` assignments
- No centralized validation
- Rate limiting mixed with business logic

### After
- **Single source of truth**: `TaskStateTransitionService`
- All status changes go through one service
- Rate limiting extracted to reusable service
- Background job for expiration
- Health monitoring

## Files Modified/Created

### New Files
- `task-state-transition.service.ts` - Centralized state transitions
- `services/rate-limit.service.ts` - Redis rate limiting
- `guards/claim-block.guard.ts` - Reusable guard
- `tasks.scheduler.ts` - Background job
- `health/health.controller.ts` - Health endpoint
- `health/health.module.ts` - Health module
- `dto/cancel-task.dto.ts` - Cancel DTO
- `dto/complete-task.dto.ts` - Complete DTO
- `database/migrations/1700000001000-AddStatusConstraint.ts` - DB constraint

### Modified Files
- `tasks.service.ts` - Refactored to use transition service
- `tasks.module.ts` - Added new providers
- `tasks.controller.ts` - Added ClaimBlockGuard
- `app.module.ts` - Added ScheduleModule and HealthModule
- `package.json` - Added @nestjs/schedule

## Testing Recommendations

1. **Concurrent Claims**: Test multiple users claiming same task simultaneously
2. **Rate Limiting**: Test cancel/refuse limits (4th should block)
3. **Expiration**: Verify tasks expire after 24h
4. **State Transitions**: Test invalid transitions throw errors
5. **Health Endpoint**: Verify all checks pass

## Migration

Run migration to add status constraint:
```bash
npm run migration:run
```

## Notes

- All status changes MUST go through `TaskStateTransitionService`
- Never directly set `task.status` outside transition service
- Expired tasks are automatically excluded from feed queries
- Rate limits reset after 24 hours
- Background job runs every 5 minutes (configurable)
