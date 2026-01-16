# Atomic Claim Logic Implementation

## Overview

The atomic claim logic ensures that only **one user** can claim a task, even under high concurrency. This is critical for the MVP requirement: "Only one user can claim a task."

## Implementation Details

### 1. Database Transaction

```typescript
await this.dataSource.transaction(
  { isolation: IsolationLevel.READ_COMMITTED },
  async (manager) => {
    // Transaction logic here
  }
);
```

- **Isolation Level**: `READ_COMMITTED` (PostgreSQL default)
- **Purpose**: Ensures all operations succeed or fail together
- **Rollback**: Automatic on any error

### 2. Pessimistic Write Lock

```typescript
const task = await taskRepository.findOne({
  where: { id: taskId },
  lock: { mode: 'pessimistic_write' }, // Row-level exclusive lock
  relations: ['createdBy', 'claimedBy'],
});
```

**What this does:**
- Executes `SELECT ... FOR UPDATE` in PostgreSQL
- Locks the row exclusively until transaction commits/rolls back
- Prevents other transactions from reading or modifying the row
- Other transactions wait until lock is released

**SQL Generated:**
```sql
SELECT * FROM tasks 
WHERE id = $1 
FOR UPDATE;  -- Exclusive lock
```

### 3. State Validation

Before any modification, we validate:
- Task exists
- Task status is `CREATED` (claimable)
- Task is not expired
- User is not the creator
- Task is not already claimed (double-check)

### 4. Atomic Update

```typescript
task.status = TaskStatus.CLAIMED;
task.claimedById = userId;
await taskRepository.save(task);
```

Both fields are updated in a single operation within the transaction.

## Concurrency Scenarios

### Scenario 1: Two Users Claim Simultaneously

```
Time    User A                    User B                    Database
----    ------                    ------                    --------
T1      BEGIN TRANSACTION
T2      SELECT ... FOR UPDATE     BEGIN TRANSACTION
T3      (row locked)              SELECT ... FOR UPDATE
T4      UPDATE status, claimedBy  (waiting for lock...)
T5      COMMIT                    (lock released)
T6                                 (row locked)
T7                                 (task already claimed)
T8                                 ROLLBACK
```

**Result**: Only User A successfully claims the task.

### Scenario 2: Task Claimed Between Lock and Update

Even with pessimistic locking, we add a double-check:

```typescript
if (task.claimedById !== null) {
  throw new ConflictException('Task has already been claimed');
}
```

This handles edge cases where the lock might not be sufficient.

## Error Handling

### Retry Logic for Deadlocks

PostgreSQL can occasionally produce deadlocks (error code `40P01`). We implement exponential backoff:

```typescript
const maxRetries = 3;
for (let attempt = 1; attempt <= maxRetries; attempt++) {
  try {
    return await this.dataSource.transaction(...);
  } catch (error) {
    if (error.code === '40P01' && attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    throw error;
  }
}
```

### Exception Types

- `NotFoundException`: Task doesn't exist
- `BadRequestException`: Invalid state, expired, or self-claim
- `ForbiddenException`: User is blocked
- `ConflictException`: Race condition detected

## Performance Considerations

### Lock Duration

- Locks are held only during the transaction
- Typical duration: < 50ms
- Long-running transactions increase lock contention

### Lock Contention

- Multiple users claiming the same task will queue
- PostgreSQL handles queuing automatically
- First transaction wins, others wait then fail validation

### Optimization

1. **Pre-transaction checks**: Blocked users fail fast (no transaction)
2. **Minimal lock time**: Validate before locking when possible
3. **Index on status**: Fast filtering of claimable tasks

## Testing

### Unit Tests

See `tasks.service.spec.ts` for:
- Successful claim
- Blocked user prevention
- Self-claim prevention
- Already claimed prevention
- Expired task handling
- Race condition handling
- Lock verification

### Load Testing

To test concurrency:

```bash
# Simulate 100 concurrent claims on same task
ab -n 100 -c 10 -p claim.json -T application/json \
  http://localhost:3001/tasks/claim
```

## Monitoring

### Logs

The service logs:
- Successful claims: `Task {id} successfully claimed by user {userId}`
- Failed attempts: Warnings with reason
- Deadlocks: Retry attempts with backoff

### Metrics to Monitor

1. **Claim success rate**: Should be ~100% for valid claims
2. **Deadlock rate**: Should be < 0.1%
3. **Average lock wait time**: Should be < 100ms
4. **Transaction duration**: Should be < 50ms

## Comparison: Pessimistic vs Optimistic Locking

### Pessimistic (Current Implementation)

**Pros:**
- ✅ Prevents race conditions completely
- ✅ Simple to implement
- ✅ Guaranteed consistency

**Cons:**
- ❌ Locks can cause contention
- ❌ Potential deadlocks (handled with retry)

### Optimistic (Alternative)

**Pros:**
- ✅ No locks, better performance
- ✅ No deadlocks

**Cons:**
- ❌ Requires version column
- ❌ Retries needed on conflicts
- ❌ More complex error handling

**Decision**: Pessimistic locking chosen for MVP simplicity and guaranteed correctness.

## Database-Level Guarantees

PostgreSQL provides:

1. **ACID Compliance**: All-or-nothing transactions
2. **Row-Level Locking**: Granular concurrency control
3. **Deadlock Detection**: Automatic detection and rollback
4. **Isolation Levels**: Configurable consistency guarantees

## Best Practices

1. ✅ Always use transactions for multi-step operations
2. ✅ Lock before reading if you plan to update
3. ✅ Keep transactions short
4. ✅ Validate state before modifying
5. ✅ Handle deadlocks with retry logic
6. ✅ Log important operations for debugging

## Future Enhancements (Not in MVP)

- Distributed locking (Redis) for multi-instance deployments
- Optimistic locking with version column
- Claim queue system for high-demand tasks
- Claim reservation (temporary hold before confirmation)
