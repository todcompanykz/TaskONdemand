# Business Logic Hardening - Changelog

## Improvements Summary

### ✅ 1. Centralized Task State Machine
- Created `TaskStateTransitionService` - single point for ALL status changes
- All transitions validated through `TaskStateMachine`
- No direct `task.status = ...` assignments outside transition service
- Structured logging for all transitions

### ✅ 2. Atomic Claim (Database Level)
- Uses PostgreSQL transaction with `SELECT ... FOR UPDATE`
- Pessimistic write lock prevents concurrent claims
- Database constraint added for status validation
- No race conditions possible

### ✅ 3. Cancel/Refuse Limits (Redis)
- `RateLimitService` for centralized rate limiting
- `ClaimBlockGuard` - reusable guard for claim endpoint
- Max 3 cancels OR refuses per 24h
- Automatic 24h block after limit exceeded
- Redis keys: `user:{id}:cancel_count:{date}` and `user:{id}:refuse_count:{date}`

### ✅ 4. Expired Tasks Job
- `TasksScheduler` with `@Cron(CronExpression.EVERY_5_MINUTES)`
- Automatically marks tasks as expired after 24h
- Uses centralized state transition service
- Expired tasks excluded from feed queries

### ✅ 5. API Contract Cleanup
- `CreateTaskDto` - validates reward divisible by 5
- `ClaimTaskDto` - validates UUID
- `CancelTaskDto` - new DTO
- `CompleteTaskDto` - new DTO
- All DTOs use class-validator

### ✅ 6. Health & Observability
- `GET /health` endpoint with:
  - Database connectivity check
  - Memory usage (heap & RSS)
  - Redis connectivity
- Structured logging for:
  - Task claims
  - Task cancellations
  - Task completions
  - Task expirations

## Breaking Changes
None - all changes are backward compatible.

## Migration Required
Run migration to add status constraint:
```bash
npm run migration:run
```

## New Dependencies
- `@nestjs/schedule` - for background jobs

## Files Changed

### New Files
- `task-state-transition.service.ts`
- `services/rate-limit.service.ts`
- `guards/claim-block.guard.ts`
- `tasks.scheduler.ts`
- `health/health.controller.ts`
- `health/health.module.ts`
- `dto/cancel-task.dto.ts`
- `dto/complete-task.dto.ts`
- `database/migrations/1700000001000-AddStatusConstraint.ts`

### Modified Files
- `tasks.service.ts` - refactored to use transition service
- `tasks.module.ts` - added new providers
- `tasks.controller.ts` - added ClaimBlockGuard
- `app.module.ts` - added ScheduleModule and HealthModule
- `package.json` - added @nestjs/schedule
