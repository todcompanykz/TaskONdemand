# Backend Architecture

## Project Structure

```
src/                    # relative to apps/backend
├── admin/              # Minimal admin panel
├── auth/              # Authentication (JWT, email/password)
├── database/          # Database config, migrations, PostGIS setup
├── redis/             # Redis service for rate limiting
├── tasks/             # Core task business logic
│   ├── dto/           # Data Transfer Objects
│   ├── entities/      # Task entity
│   └── task-state-machine.ts
├── users/             # User management
└── main.ts            # Application entry point
```

## Database Schema

### Users Table
- `id` (UUID, PK)
- `email` (unique)
- `password` (bcrypt hashed)
- `phoneNumber` (nullable)
- `createdAt`, `updatedAt`

### Tasks Table
- `id` (UUID, PK)
- `shortDescription` (varchar)
- `fullDescription` (text)
- `reward` (integer, divisible by 5)
- `geoPoint` (PostGIS Point, SRID 4326)
- `urgency` (enum: low/medium/high)
- `status` (enum: created/claimed/completed/cancelled/expired)
- `createdById` (FK to users)
- `claimedById` (FK to users, nullable)
- `customerConfirmed` (boolean)
- `executorConfirmed` (boolean)
- `expiresAt` (timestamp, 24h after creation)
- `createdAt`, `updatedAt`

**Indexes:**
- Spatial index on `geoPoint` (GIST)
- Indexes on `createdById`, `claimedById`, `status`, `expiresAt`

## Task State Machine

### Valid Transitions
```
created → claimed
created → cancelled (by creator)
created → expired (after 24h, automatic)
claimed → completed (both confirm)
claimed → cancelled (by creator or executor)
```

### Terminal States
- `completed`
- `cancelled`
- `expired`

## Core Features Implementation

### 1. Atomic Claim Logic
- Uses database transaction with pessimistic locking
- Row-level lock on task during claim
- Prevents race conditions
- Validates state before transition

### 2. Feed with PostGIS
- Fixed 1km radius (1000 meters)
- Uses `ST_DWithin` with geography type for accurate distance
- Filters by status = `created` and `expiresAt > now()`
- Ordered by creation date (newest first)

### 3. Anti-Abuse System
- Redis-based rate limiting
- Tracks cancel/refuse counts per user per day
- Max 3 cancels/refusals per 24h
- After limit: blocks claim action for 24h
- Keys: `cancel_count:{userId}:{date}`, `refuse_count:{userId}:{date}`, `claim_block:{userId}`

### 4. Completion Flow
- Two-step confirmation:
  1. Creator confirms "work completed" → `customerConfirmed = true`
  2. Executor confirms "payment received" → `executorConfirmed = true`
- When both are true → status = `completed`

### 5. Phone Number Visibility
- After claim, both parties can see each other's phone numbers
- Implemented via task details endpoint with access control
- Only creator and claimer can view claimed tasks

## API Design

### Authentication
- JWT-based authentication
- 7-day token expiration
- Protected routes use `JwtAuthGuard`

### Error Handling
- Standard HTTP status codes
- Validation errors via class-validator
- Custom error messages for business logic

### DTOs
- Input validation at controller level
- Type-safe data transfer
- Custom validators (e.g., reward divisible by 5)

## Security Considerations

1. **Password Hashing**: bcrypt with salt rounds = 10
2. **JWT Secret**: Must be set in environment
3. **SQL Injection**: TypeORM parameterized queries
4. **Race Conditions**: Pessimistic locking for claims
5. **Rate Limiting**: Redis-based anti-abuse

## Performance

1. **Database Indexes**: Optimized for common queries
2. **Spatial Index**: GIST index on geoPoint for fast geo queries
3. **Connection Pooling**: TypeORM handles connection pooling
4. **Redis Caching**: Used for rate limits and blocks

## Future Considerations (Not in MVP)

- RabbitMQ integration (structure ready)
- Firebase Cloud Messaging (notifications)
- AWS S3 (file storage)
- Scheduled jobs for expiring tasks (manual trigger for MVP)
